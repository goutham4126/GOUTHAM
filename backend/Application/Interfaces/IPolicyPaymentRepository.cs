using Domain.Entities;

namespace Application.Interfaces
{
    public interface IPolicyPaymentRepository
    {
        Task<List<PolicyPayment>> GetByPolicyIdAsync(Guid policyId);
        Task AddAsync(PolicyPayment payment);
        Task UpdateAsync(PolicyPayment payment);
    }
}