using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Application.DTOs.Insurance;
using Microsoft.Extensions.Logging;

namespace Application.Services
{
    public class PolicyService : IPolicyService
    {
        private readonly IAppDbContext _context;
        private readonly IPolicyRepository _policyRepo;
        private readonly IPlanRepository _planRepo;
        private readonly IPolicyPaymentRepository _paymentRepo;
        private readonly IPolicyRequestRepository _policyRequestRepo;
        private readonly IVercelBlobService _blobService;
        private readonly IInvoiceGeneratorService _invoiceGenerator;
        private readonly ILogger<PolicyService> _logger;
        private readonly INotificationService _notificationService;
        private readonly IWebhookNotificationService _webhookNotificationService;
        private readonly IAiDocumentService _aiDocumentService;

        public PolicyService(
        IPolicyRepository policyRepo,
        IPlanRepository planRepo,
        IPolicyPaymentRepository paymentRepo,
        IPolicyRequestRepository policyRequestRepo,
        IAppDbContext context,
        IVercelBlobService blobService,
        IInvoiceGeneratorService invoiceGenerator,
        ILogger<PolicyService> logger,
        INotificationService notificationService,
        IWebhookNotificationService webhookNotificationService,
        IAiDocumentService aiDocumentService)
        {
            _policyRepo = policyRepo;
            _planRepo = planRepo;
            _paymentRepo = paymentRepo;
            _policyRequestRepo = policyRequestRepo;
            _context = context;
            _blobService = blobService;
            _invoiceGenerator = invoiceGenerator;
            _logger = logger;
            _notificationService = notificationService;
            _webhookNotificationService = webhookNotificationService;
            _aiDocumentService = aiDocumentService;
        }

        public async Task<PolicyDto> PurchasePolicyAsync(Guid userId, Guid requestId)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var request = await _policyRequestRepo.GetByIdAsync(requestId)
                    ?? throw new Exception("Policy request not found");

                if (request.UserId != userId)
                    throw new UnauthorizedAccessException("Not your policy request");

                if (request.Status != PolicyRequestStatus.Approved)
                    throw new InvalidOperationException("Policy request is not approved");

                var plan = await _planRepo.GetByIdAsync(request.PlanId)
                    ?? throw new Exception("Plan not found");

                if (!plan.IsActive)
                    throw new InvalidOperationException("Plan is no longer active");

                var selectedAgentId = request.AgentId ?? throw new InvalidOperationException("Request has no assigned agent");

                int durationInMonths = request.DurationInMonths;
                PaymentFrequency paymentFrequency = request.PaymentFrequency;
                Guid planId = request.PlanId;

                // Snapshot plan values at purchase time (plan may change in future)
                var snapshotBaseCoverage = plan.CoverageAmount;
                
                int planDefaultDuration = plan.DurationInMonths > 0 ? plan.DurationInMonths : durationInMonths;

                // Coverage scales proportionally with the chosen duration
                var calculatedCoverage = snapshotBaseCoverage * ((decimal)durationInMonths / planDefaultDuration);

                // Premium ALSO scales proportionally
                var snapshotBaseTotalPremium = Math.Ceiling(plan.PremiumAmount * ((decimal)durationInMonths / planDefaultDuration));

                // Calculate risk multiplier
                decimal riskMultiplier = 1m + (request.RiskScore / 100m);
                decimal adjustedTotalPremium = Math.Ceiling(snapshotBaseTotalPremium * riskMultiplier);

                int interval = paymentFrequency switch
                {
                    PaymentFrequency.Monthly => 1,
                    PaymentFrequency.Quarterly => 3,
                    PaymentFrequency.Yearly => 12,
                    _ => 1
                };

                int numberOfInstallments = durationInMonths / interval;
                if (numberOfInstallments == 0) numberOfInstallments = 1;

                decimal installmentAmount = Math.Ceiling(adjustedTotalPremium / numberOfInstallments);

                var policy = new Policy
                {
                    UserId = userId,
                    PlanId = planId,
                    AgentId = selectedAgentId,
                    StartDate = DateTime.UtcNow,
                    EndDate = DateTime.UtcNow.AddMonths(durationInMonths),
                    DurationInMonths = durationInMonths,
                    PaymentFrequency = paymentFrequency,
                    TotalPremium = installmentAmount * numberOfInstallments,
                    TotalPaid = 0,
                    Status = PolicyStatus.Active,
                    // Frozen snapshots never updated after creation
                    PlanBaseCoverageAmount = snapshotBaseCoverage,
                    PlanBasePremiumAmount  = plan.PremiumAmount,
                    CoverageAmount         = calculatedCoverage
                };

                await _policyRepo.AddAsync(policy);

                _logger.LogInformation("Policy {PolicyId} purchased by User {UserId} for Plan {PlanId}", policy.Id, userId, planId);

                // Auto-generate payment schedule (uses pre-calculated 'interval')
                var paymentDate = policy.StartDate;
                bool isFirstPayment = true;
                PolicyPayment? firstPaymentToInvoice = null;

                for (int i = 0; i < durationInMonths; i += interval)
                {
                    var payment = new PolicyPayment
                    {
                        PolicyId = policy.Id,
                        Amount = installmentAmount,
                        DueDate = paymentDate,
                        Status = PaymentStatus.Pending
                    };

                    // Auto-pay the first installment at purchase time
                    if (isFirstPayment)
                    {
                        payment.Status = PaymentStatus.Paid;
                        payment.PaidDate = DateTime.UtcNow;
                        policy.TotalPaid = payment.Amount;
                        firstPaymentToInvoice = payment;
                        isFirstPayment = false;
                    }

                    await _paymentRepo.AddAsync(payment);
                    paymentDate = paymentDate.AddMonths(interval);
                }

                await _policyRepo.UpdateAsync(policy);

                request.Status = PolicyRequestStatus.Purchased;
                await _policyRequestRepo.UpdateAsync(request);

                // Generate both invoices INSIDE the transaction so the purchase
                // only commits when both invoices are successfully created.
                var customer = await _context.Users.FindAsync(userId);
                if (customer != null)
                {
                    // 1) Policy Purchase Invoice
                    PolicyAiDocumentResponseDto? aiSections = null;
                    if (customer != null)
                    {
                        var aiRequest = new PolicyAiDocumentRequestDto
                        {
                            PolicyId = policy.Id.ToString(),
                            CustomerName = $"{customer.FirstName} {customer.LastName}",
                            CustomerEmail = customer.Email,
                            PlanName = plan.Name,
                            CoverageAmount = policy.CoverageAmount,
                            PolicyDurationMonths = policy.DurationInMonths,
                            PaymentFrequency = policy.PaymentFrequency.ToString(),
                            TotalPremium = policy.TotalPremium,
                            PolicyStartDate = policy.StartDate.ToString("yyyy-MM-dd"),
                            PolicyCompletionDate = policy.EndDate.ToString("yyyy-MM-dd")
                        };
                        aiSections = await _aiDocumentService.GenerateDocumentSectionsAsync(aiRequest);
                    }

                    var pdfBytes = _invoiceGenerator.GeneratePolicyInvoice(policy, customer, aiSections);
                    var fileName = $"policy_{policy.Id}_{DateTime.UtcNow.Ticks}.pdf";
                    var fileUrl = await _blobService.UploadFileAsync(pdfBytes, fileName, "policy_purchase_invoices");

                    var invoice = new Invoice
                    {
                        UserId = userId,
                        ReferenceId = policy.Id,
                        Type = InvoiceType.PolicyPurchase,
                        FileUrl = fileUrl
                    };
                    _context.Invoices.Add(invoice);
                    await _context.SaveChangesAsync();

                    // Load navigation properties for DTO mapping
                    var fullPolicyResult = await _context.Policies
                        .Include(p => p.User)
                        .Include(p => p.Agent)
                        .Include(p => p.Plan)
                        .Include(p => p.Payments)
                        .FirstAsync(p => p.Id == policy.Id);

                    // 2) Initial Payment Invoice
                    if (firstPaymentToInvoice != null)
                    {
                        var paymentPdfBytes = _invoiceGenerator.GeneratePaymentInvoice(policy, firstPaymentToInvoice, customer);
                        var paymentFileName = $"payment_{firstPaymentToInvoice.Id}_{DateTime.UtcNow.Ticks}.pdf";
                        var paymentFileUrl = await _blobService.UploadFileAsync(paymentPdfBytes, paymentFileName, "payment_invoices");

                        var paymentInvoice = new Invoice
                        {
                            UserId = userId,
                            ReferenceId = firstPaymentToInvoice.Id,
                            Type = InvoiceType.Payment,
                            FileUrl = paymentFileUrl
                        };
                        _context.Invoices.Add(paymentInvoice);
                        await _context.SaveChangesAsync();
                    }

                    // Trigger n8n Webhook with invoice URL
                    _ = _webhookNotificationService.SendPolicyPurchaseEmailAsync(
                        customer.Email,
                        $"{customer.FirstName} {customer.LastName}",
                        plan.Name,
                        fileUrl);
                }

                await transaction.CommitAsync();

                _logger.LogInformation("First installment of {Amount} auto-paid for Policy {PolicyId}", policy.TotalPaid, policy.Id);

                // Notify User
                await _notificationService.SendNotificationAsync(
                    userId,
                    "Policy Purchased",
                    $"Successfully purchased policy based on the {plan.Name} plan."
                );

                // Reload for DTO mapping if needed (already done above for fullPolicyResult)
                var fullPolicy = await _context.Policies
                    .Include(p => p.User)
                    .Include(p => p.Agent)
                    .Include(p => p.Plan)
                    .Include(p => p.Payments)
                    .FirstAsync(p => p.Id == policy.Id);

                return MapPolicyToDto(fullPolicy);
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

            // Generate and save Payment Invoice
            var customer = await _context.Users.FindAsync(userId);
            if (customer != null)
            {
                try
                {
                    var pdfBytes = _invoiceGenerator.GeneratePaymentInvoice(policy, payment, customer);
                    var fileName = $"payment_{payment.Id}_{DateTime.UtcNow.Ticks}.pdf";
                    var fileUrl = await _blobService.UploadFileAsync(pdfBytes, fileName, "payment_invoices");

                    var invoice = new Invoice
                    {
                        UserId = userId,
                        ReferenceId = payment.Id,
                        Type = InvoiceType.Payment,
                        FileUrl = fileUrl
                    };
                    _context.Invoices.Add(invoice);
                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to generate payment invoice for payment {PaymentId}", payment.Id);
                }
            }

            _logger.LogInformation("Payment {PaymentId} of {Amount} processed for Policy {PolicyId}", payment.Id, payment.Amount, policy.Id);

            // Notify User
            await _notificationService.SendNotificationAsync(
                userId,
                "Payment Received",
                $"Your payment of ${payment.Amount:N2} was successfully processed."
            );
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
                policy.CoverageAmount,
                policy.PlanBaseCoverageAmount,
                policy.PlanBasePremiumAmount,
                new PlanDto(
                    policy.Plan.Id,
                    policy.Plan.Name,
                    policy.Plan.Description,
                    policy.Plan.Benefits,
                    policy.Plan.PremiumAmount,
                    policy.Plan.CoverageAmount,
                    policy.Plan.DurationInMonths,
                    policy.Plan.PaymentFrequency,
                    policy.Plan.PlanType,
                    policy.Plan.IsActive
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
