using Domain.Entities;

namespace Application.Interfaces
{
    public interface IPolicyPaymentRepository
    {
        Task<PolicyPayment?> GetByIdAsync(Guid id);
        Task<List<PolicyPayment>> GetByPolicyIdAsync(Guid policyId);
        Task AddAsync(PolicyPayment payment);
        Task UpdateAsync(PolicyPayment payment);
    }
}