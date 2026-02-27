using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Application.DTOs.Insurance;

namespace Infrastructure.Services
{
    public class ClaimService : IClaimService
    {
        private readonly AppDbContext _context;
        private readonly IClaimRepository _claimRepo;
        private readonly IPolicyRepository _policyRepo;

        public ClaimService(IClaimRepository claimRepo, IPolicyRepository policyRepo, AppDbContext context)
        {
            _claimRepo = claimRepo;
            _policyRepo = policyRepo;
            _context = context;
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
            var policy = await _policyRepo.GetByIdAsync(policyId)
                ?? throw new KeyNotFoundException("Policy not found");

            if (policy.UserId != userId)
                throw new UnauthorizedAccessException("Not your policy");

            var officers = await _context.Users
                .Where(u => u.Role == UserRole.ClaimOfficer && !u.IsDeleted)
                .Include(u => u.Claims)
                .ToListAsync();

            if (!officers.Any())
                throw new InvalidOperationException("No claim officers available");

            var selectedOfficer = officers
                .OrderBy(o => o.Claims.Count)
                .First();

            var claim = new Claim
            {
                UserId = userId,
                PolicyId = policyId,
                Reason = reason,
                ClaimAmount = amount,
                ClaimOfficerId = selectedOfficer.Id,
                DocumentUrl = documentUrl,
                DocumentHash = documentHash,
                BlockchainTxHash = blockchainTxHash,
                Status = ClaimStatus.Pending
            };

            await _claimRepo.AddAsync(claim);

            return MapClaimToDto(claim);
        }
        public async Task<List<ClaimDto>> GetUserClaimsAsync(Guid userId)
        {
            var claims = await _claimRepo.GetByUserIdAsync(userId);
            return claims.Select(MapClaimToDto).ToList();
        }

        public async Task<List<ClaimDto>> GetAllClaimsAsync()
        {
            var claims = await _claimRepo.GetAllAsync();
            return claims.Select(MapClaimToDto).ToList();
        }

        public async Task ApproveClaimAsync(Guid claimId, decimal approvedAmount)
        {
            var claim = await _claimRepo.GetByIdAsync(claimId)
                ?? throw new Exception("Claim not found");

            claim.Status = ClaimStatus.Approved;
            claim.ApprovedAmount = approvedAmount;
            claim.ProcessedAt = DateTime.UtcNow;

            claim.ClaimPayment = new ClaimPayment
            {
                ClaimId = claim.Id,
                AmountPaid = approvedAmount,
                PaidAt = DateTime.UtcNow
            };

            await _claimRepo.UpdateAsync(claim);
        }

        public async Task RejectClaimAsync(Guid claimId)
        {
            var claim = await _claimRepo.GetByIdAsync(claimId)
                ?? throw new Exception("Claim not found");

            claim.Status = ClaimStatus.Rejected;
            claim.ProcessedAt = DateTime.UtcNow;

            await _claimRepo.UpdateAsync(claim);
        }

        public async Task<List<ClaimDto>> GetAssignedClaimsAsync(Guid officerId)
        {
            var claims = await _context.Claims
                .Where(c => c.ClaimOfficerId == officerId)
                .Include(c => c.User)
                .Include(c => c.ClaimOfficer)
                .ToListAsync();

            return claims.Select(MapClaimToDto).ToList();
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
                claim.BlockchainTxHash
            );
        }
    }
}