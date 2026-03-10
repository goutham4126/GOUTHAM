using System.Security.Cryptography;
using Application.Interfaces;
using Application.DTOs.Insurance;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Services
{
    public class PolicyRequestService : IPolicyRequestService
    {
        private readonly IPolicyRequestRepository _policyRequestRepo;
        private readonly IPlanRepository _planRepo;
        private readonly IAppDbContext _context;
        private readonly IVercelBlobService _blobService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<PolicyRequestService> _logger;

        public PolicyRequestService(
            IPolicyRequestRepository policyRequestRepo,
            IPlanRepository planRepo,
            IAppDbContext context,
            IVercelBlobService blobService,
            INotificationService notificationService,
            ILogger<PolicyRequestService> logger)
        {
            _policyRequestRepo = policyRequestRepo;
            _planRepo = planRepo;
            _context = context;
            _blobService = blobService;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<PolicyRequestDto> CreatePolicyRequestAsync(Guid userId, Guid planId, int durationMonths, PaymentFrequency paymentFrequency, byte[] panFileBytes, string panFileName, byte[] addressFileBytes, string addressFileName)
        {
            var plan = await _planRepo.GetByIdAsync(planId)
                ?? throw new Exception("Plan not found");

            if (!plan.IsActive)
                throw new InvalidOperationException("Plan is no longer active");

            // Upload PAN (unique prefix so the same file can be re-uploaded for a new request)
            var uniquePanFileName = $"{Guid.NewGuid()}_{panFileName}";
            var pUrl = await _blobService.UploadFileAsync(panFileBytes, uniquePanFileName, "pan_documents");
            var pHash = ComputeSha256Hash(panFileBytes);

            // Upload Address Proof (unique prefix for same reason)
            var uniqueAddressFileName = $"{Guid.NewGuid()}_{addressFileName}";
            var aUrl = await _blobService.UploadFileAsync(addressFileBytes, uniqueAddressFileName, "address_documents");
            var aHash = ComputeSha256Hash(addressFileBytes);

            var riskScore = CalculateRiskScore(plan, durationMonths, paymentFrequency);

            var agents = await _context.Users
                .Where(u => u.Role == UserRole.Agent && !u.IsDeleted)
                .Select(u => new {
                    u.Id,
                    PendingCount = _context.PolicyRequests.Count(pr => pr.AgentId == u.Id && pr.Status == PolicyRequestStatus.Pending)
                })
                .ToListAsync();

            Guid? assignedAgentId = agents.Any() 
                ? agents.OrderBy(a => a.PendingCount).First().Id 
                : (Guid?)null;

            var request = new PolicyRequest
            {
                UserId = userId,
                PlanId = planId,
                AgentId = assignedAgentId,
                DurationInMonths = durationMonths,
                PaymentFrequency = paymentFrequency,
                RiskScore = riskScore,
                PanDocumentUrl = pUrl,
                PanDocumentHash = pHash,
                AddressProofUrl = aUrl,
                AddressProofHash = aHash,
                Status = PolicyRequestStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _policyRequestRepo.AddAsync(request);

            // Notify the assigned agent
            if (assignedAgentId.HasValue)
            {
                var customer = await _context.Users.FindAsync(userId);
                var customerName = customer != null ? $"{customer.FirstName} {customer.LastName}" : "A customer";
                await _notificationService.SendNotificationAsync(
                    assignedAgentId.Value,
                    "New Policy Request Assigned",
                    $"A new policy request for \"{plan.Name}\" has been assigned to you by {customerName}. Please review it from your dashboard."
                );
            }

            _logger.LogInformation("Policy request {RequestId} created for User {UserId}", request.Id, userId);

            var fullRequest = await _policyRequestRepo.GetByIdAsync(request.Id);
            return MapToDto(fullRequest!);
        }

        public async Task<List<PolicyRequestDto>> GetUserRequestsAsync(Guid userId)
        {
            var requests = await _policyRequestRepo.GetByUserIdAsync(userId);
            return requests.Select(MapToDto).ToList();
        }

        public async Task<List<PolicyRequestDto>> GetAgentRequestsAsync(Guid agentId)
        {
            var requests = await _policyRequestRepo.GetByAgentIdAsync(agentId);
            return requests.Select(MapToDto).ToList();
        }

        public async Task<PolicyRequestDto> ApproveRequestAsync(Guid requestId, Guid agentId, string? remarks)
        {
            var request = await _policyRequestRepo.GetByIdAsync(requestId)
                ?? throw new Exception("Policy request not found");

            if (request.Status != PolicyRequestStatus.Pending)
                throw new InvalidOperationException("Only pending requests can be approved.");

            request.Status = PolicyRequestStatus.Approved;
            request.AgentId = agentId;
            request.Remarks = remarks;
            request.ReviewedAt = DateTime.UtcNow;

            await _policyRequestRepo.UpdateAsync(request);

            // Notify user
            await _notificationService.SendNotificationAsync(
                request.UserId,
                "Policy Request Approved",
                "Your policy request has been approved. You can now complete the purchase."
            );

            return MapToDto(request);
        }

        public async Task<PolicyRequestDto> RejectRequestAsync(Guid requestId, Guid agentId, string reason, string? remarks)
        {
            var request = await _policyRequestRepo.GetByIdAsync(requestId)
                ?? throw new Exception("Policy request not found");

            if (request.Status != PolicyRequestStatus.Pending)
                throw new InvalidOperationException("Only pending requests can be rejected.");

            request.Status = PolicyRequestStatus.Rejected;
            request.AgentId = agentId;
            request.RejectionReason = reason;
            request.Remarks = remarks;
            request.ReviewedAt = DateTime.UtcNow;

            await _policyRequestRepo.UpdateAsync(request);

            // Notify user
            await _notificationService.SendNotificationAsync(
                request.UserId,
                "Policy Request Rejected",
                "Your policy request has been rejected."
            );

            return MapToDto(request);
        }

        private decimal CalculateRiskScore(Plan plan, int durationMonths, PaymentFrequency frequency)
        {
            decimal score = 5m; // Base score

            // Plan Risk
            if (plan.PlanType != null && plan.PlanType.Contains("Disaster", StringComparison.OrdinalIgnoreCase))
            {
                score += 20m;
            }
            else
            {
                score += 15m;
            }

            // Duration Risk
            decimal durationYears = durationMonths / 12.0m;
            score += Math.Min(15m, 1.2m * durationYears);

            // Frequency Risk
            if (frequency == PaymentFrequency.Monthly)
                score += 6m;
            else if (frequency == PaymentFrequency.Quarterly)
                score += 3m;

            // Coverage Risk
            decimal defaultDuration = plan.DurationInMonths > 0 ? plan.DurationInMonths : durationMonths;
            decimal computedCoverage = plan.CoverageAmount * ((decimal)durationMonths / defaultDuration);
            score += Math.Min(15m, (computedCoverage / 500000m) * 2m);

            return Math.Min(100m, score);
        }

        private static string ComputeSha256Hash(byte[] rawData)
        {
            using (SHA256 sha256Hash = SHA256.Create())
            {
                byte[] bytes = sha256Hash.ComputeHash(rawData);
                return Convert.ToHexString(bytes).ToLower();
            }
        }

        private static PolicyRequestDto MapToDto(PolicyRequest r)
        {
            return new PolicyRequestDto(
                r.Id,
                r.PlanId,
                r.Plan.Name,
                r.UserId,
                r.User.FirstName + " " + r.User.LastName,
                r.AgentId,
                r.Agent != null ? r.Agent.FirstName + " " + r.Agent.LastName : null,
                r.DurationInMonths,
                r.PaymentFrequency.ToString(),
                r.RiskScore,
                r.PanDocumentUrl,
                r.AddressProofUrl,
                r.Status.ToString(),
                r.RejectionReason,
                r.CreatedAt,
                r.ReviewedAt,
                r.Remarks
            );
        }
    }
}
