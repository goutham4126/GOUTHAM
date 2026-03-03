using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Tests.Repositories
{
    public class PlanRepositoryTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly PlanRepository _repository;

        public PlanRepositoryTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _repository = new PlanRepository(_context);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Fact]
        public async Task AddAsync_AddsPlanToDatabase()
        {
            var plan = new Plan
            {
                Name = "Gold",
                Description = "Premium plan",
                PremiumAmount = 100,
                CoverageAmount = 50000,
                DurationInMonths = 12,
                PaymentFrequency = "Monthly",
                PlanType = "Health"
            };

            await _repository.AddAsync(plan);

            var found = await _context.Plans.FindAsync(plan.Id);
            Assert.NotNull(found);
            Assert.Equal("Gold", found!.Name);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsOnlyActivePlans()
        {
            _context.Plans.AddRange(
                new Plan { Name = "Active1", Description = "D", PremiumAmount = 10, CoverageAmount = 1000, DurationInMonths = 6, PaymentFrequency = "M", PlanType = "H", IsActive = true },
                new Plan { Name = "Active2", Description = "D", PremiumAmount = 20, CoverageAmount = 2000, DurationInMonths = 12, PaymentFrequency = "Q", PlanType = "L", IsActive = true },
                new Plan { Name = "Inactive", Description = "D", PremiumAmount = 30, CoverageAmount = 3000, DurationInMonths = 24, PaymentFrequency = "Y", PlanType = "A", IsActive = false }
            );
            await _context.SaveChangesAsync();

            var result = await _repository.GetAllAsync();

            Assert.Equal(2, result.Count);
            Assert.DoesNotContain(result, p => p.Name == "Inactive");
        }

        [Fact]
        public async Task GetByIdAsync_ExistingPlan_ReturnsPlan()
        {
            var plan = new Plan { Name = "Test", Description = "D", PremiumAmount = 10, CoverageAmount = 1000, DurationInMonths = 6, PaymentFrequency = "M", PlanType = "H" };
            _context.Plans.Add(plan);
            await _context.SaveChangesAsync();

            var result = await _repository.GetByIdAsync(plan.Id);

            Assert.NotNull(result);
            Assert.Equal("Test", result!.Name);
        }

        [Fact]
        public async Task GetByIdAsync_NonExisting_ReturnsNull()
        {
            var result = await _repository.GetByIdAsync(Guid.NewGuid());
            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateAsync_ModifiesPlan()
        {
            var plan = new Plan { Name = "Old", Description = "D", PremiumAmount = 10, CoverageAmount = 1000, DurationInMonths = 6, PaymentFrequency = "M", PlanType = "H" };
            _context.Plans.Add(plan);
            await _context.SaveChangesAsync();

            plan.Name = "Updated";
            await _repository.UpdateAsync(plan);

            var updated = await _context.Plans.FindAsync(plan.Id);
            Assert.Equal("Updated", updated!.Name);
        }

        [Fact]
        public async Task DeleteAsync_SetsIsActiveToFalse()
        {
            var plan = new Plan { Name = "ToDelete", Description = "D", PremiumAmount = 10, CoverageAmount = 1000, DurationInMonths = 6, PaymentFrequency = "M", PlanType = "H", IsActive = true };
            _context.Plans.Add(plan);
            await _context.SaveChangesAsync();

            await _repository.DeleteAsync(plan);

            var deleted = await _context.Plans.FindAsync(plan.Id);
            Assert.False(deleted!.IsActive);
        }
    }
}
