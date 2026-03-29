using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;


namespace Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email && !u.IsDeleted);
        }

        public async Task<User?> GetByIdAsync(Guid id, bool includeDeactivated = false)
        {
            var query = _context.Users.AsQueryable();
            if (includeDeactivated)
            {
                query = query.IgnoreQueryFilters();
            }
            return await query.FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<List<User>> GetAllAsync(bool includeDeactivated = false)
        {
            var query = _context.Users.AsQueryable();
            if (includeDeactivated)
            {
                query = query.IgnoreQueryFilters();
            }
            return await query.ToListAsync();
        }

        public async Task AddAsync(User user)
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> EmailExistsAsync(string email)
        {
            return await _context.Users
                .AnyAsync(u => u.Email == email);
        }

        public async Task DeactivateAsync(Guid id)
        {
            var user = await GetByIdAsync(id, true);
            if (user != null)
            {
                user.IsDeleted = true;
                await _context.SaveChangesAsync();
            }
        }

        public async Task ReactivateAsync(Guid id)
        {
            var user = await GetByIdAsync(id, true);
            if (user != null)
            {
                user.IsDeleted = false;
                await _context.SaveChangesAsync();
            }
        }
    }
}
