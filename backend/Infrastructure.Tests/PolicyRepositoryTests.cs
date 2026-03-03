using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Tests
{
    public class PolicyRepositoryTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly PolicyRepository _repository;

        public PolicyRepositoryTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _repository = new PolicyRepository(_context);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        private (User user, Plan plan) SeedBasicData()
        {
            var user = new User { FirstName = "A", LastName = "B", Email = "a@b.com", PasswordHash = "h" };
            var plan = new Plan { Name = "P", Description = "D", PremiumAmount = 10, CoverageAmount = 1000, DurationInMonths = 12, PaymentFrequency = "M", PlanType = "H" };
            _context.Users.Add(user);
            _context.Plans.Add(plan);
            _context.SaveChanges();
            return (user, plan);
        }

        [Fact]
        public async Task AddAsync_AddsPolicyToDatabase()
        {
            var (user, plan) = SeedBasicData();

            var policy = new Policy
            {
                UserId = user.Id,
                PlanId = plan.Id,
                DurationInMonths = 12,
                PaymentFrequency = PaymentFrequency.Monthly,
                TotalPremium = 120,
                TotalPaid = 0,
                CoverageAmount = 1000,
                PlanBaseCoverageAmount = 1000,
                PlanBasePremiumAmount = 10
            };

            await _repository.AddAsync(policy);

            var found = await _context.Policies.FindAsync(policy.Id);
            Assert.NotNull(found);
        }

        [Fact]
        public async Task GetByIdAsync_ExistingPolicy_ReturnsPolicyWithIncludes()
        {
            var (user, plan) = SeedBasicData();

            var policy = new Policy
            {
                UserId = user.Id,
                PlanId = plan.Id,
                DurationInMonths = 12,
                PaymentFrequency = PaymentFrequency.Monthly,
                TotalPremium = 120,
                TotalPaid = 0,
                CoverageAmount = 1000,
                PlanBaseCoverageAmount = 1000,
                PlanBasePremiumAmount = 10
            };
            _context.Policies.Add(policy);
            await _context.SaveChangesAsync();

            var result = await _repository.GetByIdAsync(policy.Id);

            Assert.NotNull(result);
            Assert.NotNull(result!.User);
            Assert.NotNull(result.Plan);
        }

        [Fact]
        public async Task GetByIdAsync_NonExisting_ReturnsNull()
        {
            var result = await _repository.GetByIdAsync(Guid.NewGuid());
            Assert.Null(result);
        }

        [Fact]
        public async Task GetByUserIdAsync_ReturnsUserPolicies()
        {
            var (user, plan) = SeedBasicData();

            _context.Policies.AddRange(
                new Policy { UserId = user.Id, PlanId = plan.Id, DurationInMonths = 6, PaymentFrequency = PaymentFrequency.Monthly, TotalPremium = 60, TotalPaid = 0, CoverageAmount = 500, PlanBaseCoverageAmount = 1000, PlanBasePremiumAmount = 10 },
                new Policy { UserId = user.Id, PlanId = plan.Id, DurationInMonths = 12, PaymentFrequency = PaymentFrequency.Quarterly, TotalPremium = 120, TotalPaid = 0, CoverageAmount = 1000, PlanBaseCoverageAmount = 1000, PlanBasePremiumAmount = 10 }
            );
            await _context.SaveChangesAsync();

            var result = await _repository.GetByUserIdAsync(user.Id);

            Assert.Equal(2, result.Count);
        }

        [Fact]
        public async Task UpdateAsync_ModifiesPolicy()
        {
            var (user, plan) = SeedBasicData();

            var policy = new Policy
            {
                UserId = user.Id,
                PlanId = plan.Id,
                DurationInMonths = 12,
                PaymentFrequency = PaymentFrequency.Monthly,
                TotalPremium = 120,
                TotalPaid = 0,
                CoverageAmount = 1000,
                PlanBaseCoverageAmount = 1000,
                PlanBasePremiumAmount = 10
            };
            _context.Policies.Add(policy);
            await _context.SaveChangesAsync();

            policy.TotalPaid = 100;
            await _repository.UpdateAsync(policy);

            var updated = await _context.Policies.FindAsync(policy.Id);
            Assert.Equal(100, updated!.TotalPaid);
        }
    }
}
