using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Application.DTOs.Insurance;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services
{
    public class PolicyService : IPolicyService
    {
        private readonly AppDbContext _context;
        private readonly IPolicyRepository _policyRepo;
        private readonly IPlanRepository _planRepo;
        private readonly IPolicyPaymentRepository _paymentRepo;
        private readonly ILogger<PolicyService> _logger;

        public PolicyService(
        IPolicyRepository policyRepo,
        IPlanRepository planRepo,
        IPolicyPaymentRepository paymentRepo,
        AppDbContext context,
        ILogger<PolicyService> logger)
        {
            _policyRepo = policyRepo;
            _planRepo = planRepo;
            _paymentRepo = paymentRepo;
            _context = context;
            _logger = logger;
        }

        public async Task<Policy> PurchasePolicyAsync(Guid userId, Guid planId, int durationInMonths, PaymentFrequency paymentFrequency)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var plan = await _planRepo.GetByIdAsync(planId)
                    ?? throw new Exception("Plan not found");

                if (!plan.IsActive)
                    throw new InvalidOperationException("Plan is no longer active");

                var agents = await _context.Users
                    .Where(u => u.Role == UserRole.Agent && !u.IsDeleted)
                    .Select(u => new { 
                        u.Id, 
                        ActiveCount = u.Policies.Count(p => p.Status == PolicyStatus.Active) 
                    })
                    .ToListAsync();

                if (!agents.Any())
                    throw new InvalidOperationException("No agents available.");

                var selectedAgentId = agents
                    .OrderBy(a => a.ActiveCount)
                    .First().Id;

                var policy = new Policy
                {
                    UserId = userId,
                    PlanId = planId,
                    AgentId = selectedAgentId,
                    StartDate = DateTime.UtcNow,
                    EndDate = DateTime.UtcNow.AddMonths(durationInMonths),
                    DurationInMonths = durationInMonths,
                    PaymentFrequency = paymentFrequency,
                    TotalPremium = plan.PremiumAmount * durationInMonths,
                    TotalPaid = 0,
                    Status = PolicyStatus.Active
                };

                await _policyRepo.AddAsync(policy);

                _logger.LogInformation("Policy {PolicyId} purchased by User {UserId} for Plan {PlanId}", policy.Id, userId, planId);

                // 🔥 Auto-generate payments
                int interval = paymentFrequency switch
                {
                    PaymentFrequency.Monthly => 1,
                    PaymentFrequency.Quarterly => 3,
                    PaymentFrequency.Yearly => 12,
                    _ => 1
                };

                var paymentDate = policy.StartDate;

                for (int i = 0; i < durationInMonths; i += interval)
                {
                    var payment = new PolicyPayment
                    {
                        PolicyId = policy.Id,
                        Amount = plan.PremiumAmount * interval,
                        DueDate = paymentDate,
                        Status = PaymentStatus.Pending
                    };

                    await _paymentRepo.AddAsync(payment);
                    paymentDate = paymentDate.AddMonths(interval);
                }

                await transaction.CommitAsync();
                return policy;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<List<PolicyDto>> GetUserPoliciesAsync(Guid userId)
        {
            var policies = await _policyRepo.GetByUserIdAsync(userId);
            return policies.Select(MapPolicyToDto).ToList();
        }

        public async Task<PolicyDto?> GetPolicyAsync(Guid policyId, Guid userId, string userRole)
        {
            var policy = await _policyRepo.GetByIdAsync(policyId);

            if (policy == null) return null;

            if (userRole == "Customer" && policy.UserId != userId)
                throw new UnauthorizedAccessException("Not your policy");

            return MapPolicyToDto(policy);
        }

        public async Task MarkPaymentAsPaidAsync(Guid paymentId, Guid userId)
        {
            var payment = await _paymentRepo.GetByIdAsync(paymentId)
                ?? throw new Exception("Payment not found");

            var policy = await _policyRepo.GetByIdAsync(payment.PolicyId);
            if (policy == null) throw new Exception("Policy not found");

            if (policy.UserId != userId)
                throw new UnauthorizedAccessException("Not your policy");

            payment.Status = PaymentStatus.Paid;
            payment.PaidDate = DateTime.UtcNow;

            await _paymentRepo.UpdateAsync(payment);

            policy.TotalPaid += payment.Amount;
            await _policyRepo.UpdateAsync(policy);

            _logger.LogInformation("Payment {PaymentId} of {Amount} processed for Policy {PolicyId}", payment.Id, payment.Amount, policy.Id);
        }

        public async Task<List<PolicyDto>> GetAssignedPoliciesAsync(Guid agentId)
        {
            var policies = await _context.Policies
                .Where(p => p.AgentId == agentId)
                .Include(p => p.User)
                .Include(p => p.Agent)
                .Include(p => p.Plan)
                .Include(p => p.Payments)
                .ToListAsync();

            return policies.Select(MapPolicyToDto).ToList();
        }

        public async Task<List<PolicyDto>> GetAllPoliciesAsync()
        {
            var policies = await _context.Policies
                .Include(p => p.User)
                .Include(p => p.Agent)
                .Include(p => p.Plan)
                .Include(p => p.Payments)
                .ToListAsync();

            return policies.Select(MapPolicyToDto).ToList();
        }

        private static PolicyDto MapPolicyToDto(Policy policy)
        {
            return new PolicyDto(
                policy.Id,
                policy.StartDate,
                policy.EndDate,
                policy.DurationInMonths,
                policy.PaymentFrequency.ToString(),
                policy.Status.ToString(),
                policy.TotalPremium,
                policy.TotalPaid,
                new PlanDto(
                    policy.Plan.Id,
                    policy.Plan.Name,
                    policy.Plan.Description,
                    policy.Plan.PremiumAmount,
                    policy.Plan.CoverageAmount,
                    policy.Plan.DurationInMonths,
                    policy.Plan.PaymentFrequency
                ),
                $"{policy.User.FirstName} {policy.User.LastName}",
                policy.Agent != null
                    ? $"{policy.Agent.FirstName} {policy.Agent.LastName}"
                    : null,
                policy.Payments.OrderBy(p => p.DueDate).Select(p => new PolicyPaymentDto(
                    p.Id,
                    p.Amount,
                    p.DueDate,
                    p.PaidDate,
                    p.Status.ToString()
                )).ToList()
            );
        }
    }
}