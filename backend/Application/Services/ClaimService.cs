using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Application.DTOs.Insurance;
using Microsoft.Extensions.Logging;

namespace Application.Services
{
    public class ClaimService : IClaimService
    {
        private readonly IAppDbContext _context;
        private readonly IClaimRepository _claimRepo;
        private readonly IPolicyRepository _policyRepo;
        private readonly IVercelBlobService _blobService;
        private readonly IInvoiceGeneratorService _invoiceGenerator;
        private readonly ILogger<ClaimService> _logger;
        private readonly INotificationService _notificationService;

        public ClaimService(
            IClaimRepository claimRepo, 
            IPolicyRepository policyRepo, 
            IAppDbContext context, 
            IVercelBlobService blobService,
            IInvoiceGeneratorService invoiceGenerator,
            ILogger<ClaimService> logger,
            INotificationService notificationService)
        {
            _claimRepo = claimRepo;
            _policyRepo = policyRepo;
            _context = context;
            _blobService = blobService;
            _invoiceGenerator = invoiceGenerator;
            _logger = logger;
            _notificationService = notificationService;
        }

        public async Task<ClaimDto> CreateClaimAsync(
        Guid userId,
        Guid policyId,
        string reason,
        decimal amount,
        string documentUrl,
        string documentHash,
        double? incidentLatitude,
        double? incidentLongitude,
        DateTime? incidentDate)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var policy = await _policyRepo.GetByIdAsync(policyId)
                    ?? throw new KeyNotFoundException("Policy not found");

                if (policy.UserId != userId)
                    throw new UnauthorizedAccessException("Not your policy");

                // Validate claim amount against the frozen policy coverage (not the live plan)
                if (amount > policy.CoverageAmount)
                    throw new InvalidOperationException(
                        $"Claim amount ${amount:N2} exceeds this policy's coverage of ${policy.CoverageAmount:N2}.");

                var officers = await _context.Users
                    .Where(u => u.Role == UserRole.ClaimOfficer && !u.IsDeleted)
                    .Select(u => new {
                        u.Id,
                        PendingCount = _context.Claims.Count(c => c.ClaimOfficerId == u.Id && c.Status == ClaimStatus.Pending)
                    })
                    .ToListAsync();

                if (!officers.Any())
                    throw new InvalidOperationException("No claim officers available");

                var selectedOfficerId = officers
                    .OrderBy(o => o.PendingCount)
                    .First().Id;

                var existingClaim = await _context.Claims
                    .Where(c => c.PolicyId == policyId && (c.Status == ClaimStatus.Approved || c.Status == ClaimStatus.Pending))
                    .FirstOrDefaultAsync();

                if (existingClaim != null)
                {
                    throw new InvalidOperationException("This policy already has an approved or pending claim.");
                }

                var claim = new Claim
                {
                    UserId = userId,
                    PolicyId = policyId,
                    Reason = reason,
                    ClaimAmount = amount,
                    ClaimOfficerId = selectedOfficerId,
                    DocumentUrl = documentUrl,
                    DocumentHash = documentHash,
                    Status = ClaimStatus.Pending,
                    IncidentLatitude = incidentLatitude,
                    IncidentLongitude = incidentLongitude,
                    IncidentDate = incidentDate
                };

                await _claimRepo.AddAsync(claim);
                await transaction.CommitAsync();

                // Notify the assigned claims officer
                var customer = await _context.Users.FindAsync(userId);
                var customerName = customer != null ? $"{customer.FirstName} {customer.LastName}" : "A customer";
                await _notificationService.SendNotificationAsync(
                    selectedOfficerId,
                    "New Claim Assigned",
                    $"A new claim of ₹{amount:N2} has been assigned to you by {customerName}. Please review it from your evaluation desk."
                );

                return MapClaimToDto(claim);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        public async Task<List<ClaimDto>> GetUserClaimsAsync(Guid userId)
        {
            var claims = await _claimRepo.GetByUserIdAsync(userId);
            var kyc = await _context.KycDetails
                .Where(k => k.UserId == userId)
                .OrderByDescending(k => k.VerifiedAt)
                .FirstOrDefaultAsync();
            return claims.OrderByDescending(c => c.SubmittedAt).Select(c => MapClaimToDto(c, kyc)).ToList();
        }

        public async Task<List<ClaimDto>> GetAllClaimsAsync()
        {
            var claims = await _claimRepo.GetAllAsync();
            var userIds = claims.Select(c => c.UserId).Distinct().ToList();
            var kycDocs = await _context.KycDetails
                .Where(k => userIds.Contains(k.UserId))
                .GroupBy(k => k.UserId)
                .Select(g => g.OrderByDescending(x => x.VerifiedAt).First())
                .ToDictionaryAsync(k => k.UserId);
            return claims.OrderByDescending(c => c.SubmittedAt)
                .Select(c => MapClaimToDto(c, kycDocs.GetValueOrDefault(c.UserId)))
                .ToList();
        }

        public async Task ApproveClaimAsync(Guid claimId, decimal approvedAmount, Guid officerId, string? remarks)
        {
            var claim = await _claimRepo.GetByIdAsync(claimId)
                ?? throw new Exception("Claim not found");

            if (claim.ClaimOfficerId != officerId)
                throw new UnauthorizedAccessException("Not assigned to this claim");

            claim.Status = ClaimStatus.Approved;
            claim.ApprovedAmount = approvedAmount;
            claim.Remarks = remarks;
            claim.ProcessedAt = DateTime.UtcNow;

            await _claimRepo.UpdateAsync(claim);

            var claimPayment = new ClaimPayment
            {
                ClaimId = claim.Id,
                AmountPaid = approvedAmount,
                PaidAt = DateTime.UtcNow
            };

            await _context.ClaimPayments.AddAsync(claimPayment);

            // Generate and save Claim Status Invoice
            await GenerateClaimInvoiceAsync(claim);

            await _context.SaveChangesAsync();
            _logger.LogInformation("Claim {ClaimId} approved for {Amount} by Officer {OfficerId}", claim.Id, approvedAmount, officerId);

            // Notify Customer
            await _notificationService.SendNotificationAsync(
                claim.UserId,
                "Claim Approved",
                $"Your claim for ${approvedAmount:N2} has been approved."
            );
        }

        public async Task RejectClaimAsync(Guid claimId, Guid officerId, string? remarks)
        {
            var claim = await _claimRepo.GetByIdAsync(claimId)
                ?? throw new Exception("Claim not found");

            if (claim.ClaimOfficerId != officerId)
                throw new UnauthorizedAccessException("Not assigned to this claim");

            claim.Status = ClaimStatus.Rejected;
            claim.Remarks = remarks;
            claim.ProcessedAt = DateTime.UtcNow;

            await _claimRepo.UpdateAsync(claim);

            // Generate and save Claim Status Invoice
            await GenerateClaimInvoiceAsync(claim);

            await _context.SaveChangesAsync();
            _logger.LogInformation("Claim {ClaimId} rejected by Officer {OfficerId}", claim.Id, officerId);

            // Notify Customer
            await _notificationService.SendNotificationAsync(
                claim.UserId,
                "Claim Rejected",
                "Your recent claim has been rejected. Please check your invoices for details."
            );
        }

        private async Task GenerateClaimInvoiceAsync(Claim claim)
        {
            try
            {
                var policy = await _policyRepo.GetByIdAsync(claim.PolicyId);
                var customer = await _context.Users.FindAsync(claim.UserId);

                if (policy != null && customer != null)
                {
                    var pdfBytes = _invoiceGenerator.GenerateClaimInvoice(policy, claim, customer);
                    var fileName = $"claim_status_{claim.Id}_{DateTime.UtcNow.Ticks}.pdf";
                    var fileUrl = await _blobService.UploadFileAsync(pdfBytes, fileName, "claim_status_invoices");

                    var invoice = new Invoice
                    {
                        UserId = claim.UserId,
                        ReferenceId = claim.Id,
                        Type = InvoiceType.ClaimStatus,
                        FileUrl = fileUrl
                    };
                    _context.Invoices.Add(invoice);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate claim invoice for claim {ClaimId}", claim.Id);
            }
        }

        public async Task<List<ClaimDto>> GetAssignedClaimsAsync(Guid officerId)
        {
            var claims = await _context.Claims
                .Where(c => c.ClaimOfficerId == officerId)
                .Include(c => c.User)
                .Include(c => c.ClaimOfficer)
                .Include(c => c.TrackingStages)
                .ToListAsync();

            var userIds = claims.Select(c => c.UserId).Distinct().ToList();
            var kycDocs = await _context.KycDetails
                .Where(k => userIds.Contains(k.UserId))
                .GroupBy(k => k.UserId)
                .Select(g => g.OrderByDescending(x => x.VerifiedAt).First())
                .ToDictionaryAsync(k => k.UserId);

            return claims.OrderByDescending(c => c.SubmittedAt)
                .Select(c => MapClaimToDto(c, kycDocs.GetValueOrDefault(c.UserId)))
                .ToList();
        }

        public async Task ScheduleVideoCallAsync(Guid claimId, Guid officerId, DateTime scheduledDate)
        {
            var claim = await _claimRepo.GetByIdAsync(claimId)
                ?? throw new KeyNotFoundException("Claim not found");

            if (claim.ClaimOfficerId != officerId)
                throw new UnauthorizedAccessException("Not assigned to this claim");

            claim.ScheduledVideoCallDate = scheduledDate;
            claim.VideoVerificationStatus = Domain.Enums.VideoVerificationStatus.Scheduled;
            await _claimRepo.UpdateAsync(claim);

            // Notify customer about the scheduled call
            var formattedDate = scheduledDate.ToString("MMMM dd, yyyy 'at' hh:mm tt");
            await _notificationService.SendNotificationAsync(
                claim.UserId,
                "Video Verification Scheduled",
                $"Your video verification call has been scheduled for {formattedDate}. Please join the call at the scheduled time from your claims dashboard."
            );

            _logger.LogInformation("Video call scheduled for Claim {ClaimId} at {ScheduledDate} by Officer {OfficerId}", claimId, scheduledDate, officerId);
        }

        public async Task CompleteVideoVerificationAsync(Guid claimId, Guid officerId, string? remarks)
        {
            var claim = await _claimRepo.GetByIdAsync(claimId)
                ?? throw new KeyNotFoundException("Claim not found");

            if (claim.ClaimOfficerId != officerId)
                throw new UnauthorizedAccessException("Not assigned to this claim");

            claim.VideoVerificationStatus = Domain.Enums.VideoVerificationStatus.Completed;
            claim.VideoVerificationRemarks = remarks;
            await _claimRepo.UpdateAsync(claim);

            // Notify customer
            await _notificationService.SendNotificationAsync(
                claim.UserId,
                "Video Verification Completed",
                "Your video verification has been completed successfully. The officer will now process your claim."
            );

            _logger.LogInformation("Video verification completed for Claim {ClaimId} by Officer {OfficerId}", claimId, officerId);
        }

        public async Task<ClaimTrackingStageDto> AddTrackingStageAsync(Guid claimId, Guid officerId, AddClaimTrackingRequest request)
        {
            var claim = await _claimRepo.GetByIdAsync(claimId)
                ?? throw new KeyNotFoundException("Claim not found");

            if (claim.ClaimOfficerId != officerId)
                throw new UnauthorizedAccessException("Not assigned to this claim");

            var trackingStage = new ClaimTrackingStage
            {
                ClaimId = claimId,
                StageName = request.StageName,
                Remarks = request.Remarks,
                CreatedAt = DateTime.UtcNow
            };

            _context.ClaimTrackingStages.Add(trackingStage);
            await _context.SaveChangesAsync();

            return new ClaimTrackingStageDto
            {
                Id = trackingStage.Id,
                ClaimId = trackingStage.ClaimId,
                StageName = trackingStage.StageName,
                Remarks = trackingStage.Remarks,
                CreatedAt = trackingStage.CreatedAt
            };
        }

        private static ClaimDto MapClaimToDto(Claim claim, KycDetails? kyc = null)
        {
            return new ClaimDto(
                claim.Id,
                claim.Reason,
                claim.ClaimAmount,
                claim.ApprovedAmount,
                claim.Status.ToString(),
                claim.SubmittedAt,
                claim.ProcessedAt,
                $"{claim.User.FirstName} {claim.User.LastName}",
                claim.ClaimOfficer != null
                    ? $"{claim.ClaimOfficer.FirstName} {claim.ClaimOfficer.LastName}"
                    : null,
                claim.DocumentUrl,
                claim.DocumentHash,
                claim.PolicyId,
                claim.Remarks,
                claim.ScheduledVideoCallDate,
                claim.VideoVerificationStatus.ToString(),
                claim.VideoVerificationRemarks,
                claim.IncidentLatitude,
                claim.IncidentLongitude,
                claim.IncidentDate,
                claim.User.Email,
                claim.User.Phone,
                claim.User.Address,
                kyc?.PanNumber,
                kyc?.PanName,
                kyc?.AadhaarReferenceId,
                kyc?.AadhaarName,
                kyc?.AadhaarAddress,
                claim.User.DateOfBirth,
                claim.User.ProfileImageUrl,
                claim.TrackingStages != null 
                    ? claim.TrackingStages.Select(t => new ClaimTrackingStageDto
                    {
                        Id = t.Id,
                        ClaimId = t.ClaimId,
                        StageName = t.StageName,
                        Remarks = t.Remarks,
                        CreatedAt = t.CreatedAt
                    }).OrderByDescending(t => t.CreatedAt).ToList()
                    : new List<ClaimTrackingStageDto>()
            );
        }
    }
}
