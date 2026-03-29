using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Tests.Repositories
{
    public class UserRepositoryTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly UserRepository _repository;

        public UserRepositoryTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _repository = new UserRepository(_context);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Fact]
        public async Task AddAsync_AddsUserToDatabase()
        {
            var user = new User
            {
                FirstName = "John",
                LastName = "Doe",
                Email = "john@test.com",
                PasswordHash = "hashed"
            };

            await _repository.AddAsync(user);

            var found = await _context.Users.FirstOrDefaultAsync(u => u.Email == "john@test.com");
            Assert.NotNull(found);
            Assert.Equal("John", found!.FirstName);
        }

        [Fact]
        public async Task GetByEmailAsync_ExistingEmail_ReturnsUser()
        {
            var user = new User { FirstName = "A", LastName = "B", Email = "a@b.com", PasswordHash = "h" };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var result = await _repository.GetByEmailAsync("a@b.com");

            Assert.NotNull(result);
            Assert.Equal("A", result!.FirstName);
        }

        [Fact]
        public async Task GetByEmailAsync_DeletedUser_ReturnsNull()
        {
            var user = new User { FirstName = "A", LastName = "B", Email = "deleted@b.com", PasswordHash = "h", IsDeleted = true };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var result = await _repository.GetByEmailAsync("deleted@b.com");

            Assert.Null(result);
        }

        [Fact]
        public async Task GetByIdAsync_ExistingUser_ReturnsUser()
        {
            var user = new User { FirstName = "A", LastName = "B", Email = "x@y.com", PasswordHash = "h" };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var result = await _repository.GetByIdAsync(user.Id);

            Assert.NotNull(result);
            Assert.Equal(user.Id, result!.Id);
        }

        [Fact]
        public async Task GetByIdAsync_NonExisting_ReturnsNull()
        {
            var result = await _repository.GetByIdAsync(Guid.NewGuid());
            Assert.Null(result);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsOnlyNonDeletedUsers()
        {
            _context.Users.AddRange(
                new User { FirstName = "A", LastName = "B", Email = "a@t.com", PasswordHash = "h" },
                new User { FirstName = "C", LastName = "D", Email = "c@t.com", PasswordHash = "h" },
                new User { FirstName = "E", LastName = "F", Email = "e@t.com", PasswordHash = "h", IsDeleted = true }
            );
            await _context.SaveChangesAsync();

            var result = await _repository.GetAllAsync();

            Assert.Equal(2, result.Count);
        }

        [Fact]
        public async Task EmailExistsAsync_ExistingEmail_ReturnsTrue()
        {
            _context.Users.Add(new User { FirstName = "A", LastName = "B", Email = "exists@t.com", PasswordHash = "h" });
            await _context.SaveChangesAsync();

            Assert.True(await _repository.EmailExistsAsync("exists@t.com"));
        }

        [Fact]
        public async Task EmailExistsAsync_NonExistingEmail_ReturnsFalse()
        {
            Assert.False(await _repository.EmailExistsAsync("noone@t.com"));
        }

        [Fact]
        public async Task UpdateAsync_ModifiesUser()
        {
            var user = new User { FirstName = "Old", LastName = "Name", Email = "u@t.com", PasswordHash = "h" };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            user.FirstName = "New";
            await _repository.UpdateAsync(user);

            var updated = await _context.Users.FindAsync(user.Id);
            Assert.Equal("New", updated!.FirstName);
        }

        [Fact]
        public async Task DeactivateAsync_DeactivatesUser()
        {
            var user = new User { FirstName = "A", LastName = "B", Email = "del@t.com", PasswordHash = "h", IsDeleted = false };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            await _repository.DeactivateAsync(user.Id);

            var suspended = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == user.Id);
            Assert.NotNull(suspended);
            Assert.True(suspended!.IsDeleted);
        }
    }
}
