using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class PolicyRequestRepository : IPolicyRequestRepository
    {
        private readonly AppDbContext _context;

        public PolicyRequestRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PolicyRequest?> GetByIdAsync(Guid id)
        {
            return await _context.PolicyRequests
                .Include(pr => pr.User)
                .Include(pr => pr.Plan)
                .Include(pr => pr.Agent)
                .FirstOrDefaultAsync(pr => pr.Id == id);
        }

        public async Task<List<PolicyRequest>> GetByUserIdAsync(Guid userId)
        {
            return await _context.PolicyRequests
                .Include(pr => pr.User)
                .Include(pr => pr.Plan)
                .Include(pr => pr.Agent)
                .Where(pr => pr.UserId == userId)
                .OrderByDescending(pr => pr.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<PolicyRequest>> GetByAgentIdAsync(Guid agentId)
        {
            return await _context.PolicyRequests
                .Include(pr => pr.User)
                .Include(pr => pr.Plan)
                .Include(pr => pr.Agent)
                .Where(pr => pr.AgentId == agentId)
                .OrderByDescending(pr => pr.CreatedAt)
                .ToListAsync();
        }

        public async Task AddAsync(PolicyRequest request)
        {
            await _context.PolicyRequests.AddAsync(request);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(PolicyRequest request)
        {
            _context.PolicyRequests.Update(request);
            await _context.SaveChangesAsync();
        }
    }
}
