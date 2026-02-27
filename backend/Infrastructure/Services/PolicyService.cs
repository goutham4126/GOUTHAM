using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Application.DTOs.Insurance;

namespace Infrastructure.Services
{
    public class PolicyService : IPolicyService
    {
        private readonly AppDbContext _context;
        private readonly IPolicyRepository _policyRepo;
        private readonly IPlanRepository _planRepo;
        private readonly IPolicyPaymentRepository _paymentRepo;

        public PolicyService(
        IPolicyRepository policyRepo,
        IPlanRepository planRepo,
        IPolicyPaymentRepository paymentRepo,
        AppDbContext context)
        {
            _policyRepo = policyRepo;
            _planRepo = planRepo;
            _paymentRepo = paymentRepo;
            _context = context;
        }

        public async Task<Policy> PurchasePolicyAsync(Guid userId, Guid planId)
        {
            var plan = await _planRepo.GetByIdAsync(planId)
                ?? throw new Exception("Plan not found");

            var agents = await _context.Users
                .Where(u => u.Role == UserRole.Agent && !u.IsDeleted)
                .Include(u => u.Policies)
                .ToListAsync();

            if (!agents.Any())
                throw new InvalidOperationException("No agents available.");

            var selectedAgent = agents
                .OrderBy(a => a.Policies.Count)
                .First();

            var policy = new Policy
            {
                UserId = userId,
                PlanId = planId,
                AgentId = selectedAgent.Id,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddMonths(plan.DurationInMonths),
                TotalPremium = plan.PremiumAmount * plan.DurationInMonths,
                TotalPaid = 0,
                Status = PolicyStatus.Active
            };

            await _policyRepo.AddAsync(policy);

            // 🔥 Auto-generate payments
            int interval = plan.PaymentFrequency switch
            {
                PaymentFrequency.Monthly => 1,
                PaymentFrequency.Quarterly => 3,
                PaymentFrequency.Yearly => 12,
                _ => 1
            };

            var paymentDate = policy.StartDate;

            for (int i = 0; i < plan.DurationInMonths; i += interval)
            {
                var payment = new PolicyPayment
                {
                    PolicyId = policy.Id,
                    Amount = plan.PremiumAmount * interval,
                    DueDate = paymentDate.AddMonths(interval),
                    Status = PaymentStatus.Pending
                };

                await _paymentRepo.AddAsync(payment);
                paymentDate = paymentDate.AddMonths(interval);
            }

            return policy;
        }

        public async Task<List<PolicyDto>> GetUserPoliciesAsync(Guid userId)
        {
            var policies = await _policyRepo.GetByUserIdAsync(userId);
            return policies.Select(MapPolicyToDto).ToList();
        }

        public async Task<PolicyDto?> GetPolicyAsync(Guid policyId)
        {
            var policy = await _policyRepo.GetByIdAsync(policyId);

            return policy == null ? null : MapPolicyToDto(policy);
        }

        public async Task MarkPaymentAsPaidAsync(Guid paymentId)
        {
            var payments = await _paymentRepo.GetByPolicyIdAsync(Guid.Empty);

            var payment = payments.FirstOrDefault(p => p.Id == paymentId)
                ?? throw new Exception("Payment not found");

            payment.Status = PaymentStatus.Paid;
            payment.PaidDate = DateTime.UtcNow;

            await _paymentRepo.UpdateAsync(payment);

            var policy = await _policyRepo.GetByIdAsync(payment.PolicyId);
            if (policy != null)
            {
                policy.TotalPaid += payment.Amount;
                await _policyRepo.UpdateAsync(policy);
            }
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

        private static PolicyDto MapPolicyToDto(Policy policy)
        {
            return new PolicyDto(
                policy.Id,
                policy.StartDate,
                policy.EndDate,
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
                    policy.Plan.PaymentFrequency.ToString()
                ),
                $"{policy.User.FirstName} {policy.User.LastName}",
                policy.Agent != null
                    ? $"{policy.Agent.FirstName} {policy.Agent.LastName}"
                    : null,
                policy.Payments.Select(p => new PolicyPaymentDto(
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