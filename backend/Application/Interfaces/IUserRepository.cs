using Domain.Entities;

namespace Application.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByIdAsync(Guid id, bool includeDeactivated = false);
        Task AddAsync(User user);
        Task UpdateAsync(User user);

        Task<List<User>> GetAllAsync(bool includeDeactivated = false);
        Task<bool> EmailExistsAsync(string email);
        Task DeactivateAsync(Guid id);
        Task ReactivateAsync(Guid id);
    }
}
