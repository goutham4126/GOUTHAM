using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Application.DTOs.Insurance;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services
{
    public class ClaimService : IClaimService
    {
        private readonly AppDbContext _context;
        private readonly IClaimRepository _claimRepo;
        private readonly IPolicyRepository _policyRepo;
        private readonly IVercelBlobService _blobService;
        private readonly IInvoiceGeneratorService _invoiceGenerator;
        private readonly ILogger<ClaimService> _logger;
        private readonly INotificationService _notificationService;

        public ClaimService(
            IClaimRepository claimRepo, 
            IPolicyRepository policyRepo, 
            AppDbContext context, 
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
        string blockchainTxHash)
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
                        PendingCount = u.Claims.Count(c => c.Status == ClaimStatus.Pending)
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
                    BlockchainTxHash = blockchainTxHash,
                    Status = ClaimStatus.Pending
                };

                await _claimRepo.AddAsync(claim);
                await transaction.CommitAsync();

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
            return claims.OrderByDescending(c => c.SubmittedAt).Select(MapClaimToDto).ToList();
        }

        public async Task<List<ClaimDto>> GetAllClaimsAsync()
        {
            var claims = await _claimRepo.GetAllAsync();
            return claims.OrderByDescending(c => c.SubmittedAt).Select(MapClaimToDto).ToList();
        }

        public async Task ApproveClaimAsync(Guid claimId, decimal approvedAmount, Guid officerId)
        {
            var claim = await _claimRepo.GetByIdAsync(claimId)
                ?? throw new Exception("Claim not found");

            if (claim.ClaimOfficerId != officerId)
                throw new UnauthorizedAccessException("Not assigned to this claim");

            claim.Status = ClaimStatus.Approved;
            claim.ApprovedAmount = approvedAmount;
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

        public async Task RejectClaimAsync(Guid claimId, Guid officerId)
        {
            var claim = await _claimRepo.GetByIdAsync(claimId)
                ?? throw new Exception("Claim not found");

            if (claim.ClaimOfficerId != officerId)
                throw new UnauthorizedAccessException("Not assigned to this claim");

            claim.Status = ClaimStatus.Rejected;
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
                .ToListAsync();

            return claims.OrderByDescending(c => c.SubmittedAt).Select(MapClaimToDto).ToList();
        }

        private static ClaimDto MapClaimToDto(Claim claim)
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
                claim.BlockchainTxHash,
                claim.PolicyId
            );
        }
    }
}