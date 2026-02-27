using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class PolicyRepository : IPolicyRepository
    {
        private readonly AppDbContext _context;

        public PolicyRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Policy?> GetByIdAsync(Guid id)
        {
            return await _context.Policies
                .Include(p => p.Plan)
                .Include(p => p.User)
                .Include(p => p.Agent)
                .Include(p => p.Payments)
                .Include(p => p.Claims)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<List<Policy>> GetByUserIdAsync(Guid userId)
        {
            return await _context.Policies
                .Include(p => p.Plan)
                .Include(p => p.Payments)
                .Where(p => p.UserId == userId)
                .ToListAsync();
        }

        public async Task AddAsync(Policy policy)
        {
            await _context.Policies.AddAsync(policy);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Policy policy)
        {
            _context.Policies.Update(policy);
            await _context.SaveChangesAsync();
        }
    }
}