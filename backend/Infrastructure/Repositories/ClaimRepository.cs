using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class ClaimRepository : IClaimRepository
    {
        private readonly AppDbContext _context;

        public ClaimRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Claim?> GetByIdAsync(Guid id)
        {
            return await _context.Claims
                .Include(c => c.Policy)
                .Include(c => c.ClaimPayment)
                .Include(c => c.User)
                .Include(c => c.ClaimOfficer)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<List<Claim>> GetByUserIdAsync(Guid userId)
        {
            return await _context.Claims
                .Include(c => c.Policy)
                .Include(c => c.User)
                .Include(c => c.ClaimOfficer)
                .Where(c => c.UserId == userId)
                .ToListAsync();
        }

        public async Task<List<Claim>> GetAllAsync()
        {
            return await _context.Claims
                .Include(c => c.Policy)
                .Include(c => c.User)
                .Include(c => c.ClaimOfficer)
                .ToListAsync();
        }

        public async Task AddAsync(Claim claim)
        {
            await _context.Claims.AddAsync(claim);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Claim claim)
        {
            _context.Claims.Update(claim);
            await _context.SaveChangesAsync();
        }
    }
}