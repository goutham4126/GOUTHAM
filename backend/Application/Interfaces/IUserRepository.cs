using Domain.Entities;

namespace Application.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByIdAsync(Guid id);
        Task AddAsync(User user);
        Task UpdateAsync(User user);

        Task<List<User>> GetAllAsync();
        Task<bool> EmailExistsAsync(string email);
        Task DeleteAsync(Guid id);
    }
}
