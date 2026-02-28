using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class PolicyPaymentRepository : IPolicyPaymentRepository
    {
        private readonly AppDbContext _context;

        public PolicyPaymentRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PolicyPayment?> GetByIdAsync(Guid id)
        {
            return await _context.PolicyPayments.FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<List<PolicyPayment>> GetByPolicyIdAsync(Guid policyId)
        {
            return await _context.PolicyPayments
                .Where(p => p.PolicyId == policyId)
                .ToListAsync();
        }

        public async Task AddAsync(PolicyPayment payment)
        {
            await _context.PolicyPayments.AddAsync(payment);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(PolicyPayment payment)
        {
            _context.PolicyPayments.Update(payment);
            await _context.SaveChangesAsync();
        }
    }
}