using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Tests
{
    public class ClaimRepositoryTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly ClaimRepository _repository;

        public ClaimRepositoryTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _repository = new ClaimRepository(_context);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        private (User user, Plan plan, Policy policy) SeedBasicData()
        {
            var user = new User { FirstName = "A", LastName = "B", Email = "a@b.com", PasswordHash = "h" };
            var plan = new Plan { Name = "P", Description = "D", PremiumAmount = 10, CoverageAmount = 1000, DurationInMonths = 12, PaymentFrequency = "M", PlanType = "H" };
            _context.Users.Add(user);
            _context.Plans.Add(plan);

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
            _context.SaveChanges();

            return (user, plan, policy);
        }

        [Fact]
        public async Task AddAsync_AddsClaimToDatabase()
        {
            var (user, _, policy) = SeedBasicData();

            var claim = new Claim
            {
                UserId = user.Id,
                PolicyId = policy.Id,
                Reason = "Accident",
                ClaimAmount = 500,
                Status = ClaimStatus.Pending
            };

            await _repository.AddAsync(claim);

            var found = await _context.Claims.FindAsync(claim.Id);
            Assert.NotNull(found);
            Assert.Equal("Accident", found!.Reason);
        }

        [Fact]
        public async Task GetByIdAsync_ExistingClaim_ReturnsClaimWithIncludes()
        {
            var (user, _, policy) = SeedBasicData();

            var claim = new Claim
            {
                UserId = user.Id,
                PolicyId = policy.Id,
                Reason = "Test",
                ClaimAmount = 100
            };
            _context.Claims.Add(claim);
            await _context.SaveChangesAsync();

            var result = await _repository.GetByIdAsync(claim.Id);

            Assert.NotNull(result);
            Assert.NotNull(result!.User);
            Assert.NotNull(result.Policy);
        }

        [Fact]
        public async Task GetByUserIdAsync_ReturnsUserClaims()
        {
            var (user, _, policy) = SeedBasicData();

            _context.Claims.AddRange(
                new Claim { UserId = user.Id, PolicyId = policy.Id, Reason = "R1", ClaimAmount = 100 },
                new Claim { UserId = user.Id, PolicyId = policy.Id, Reason = "R2", ClaimAmount = 200 }
            );
            await _context.SaveChangesAsync();

            var result = await _repository.GetByUserIdAsync(user.Id);

            Assert.Equal(2, result.Count);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsAllClaims()
        {
            var (user, _, policy) = SeedBasicData();

            _context.Claims.AddRange(
                new Claim { UserId = user.Id, PolicyId = policy.Id, Reason = "R1", ClaimAmount = 100 },
                new Claim { UserId = user.Id, PolicyId = policy.Id, Reason = "R2", ClaimAmount = 200 }
            );
            await _context.SaveChangesAsync();

            var result = await _repository.GetAllAsync();

            Assert.Equal(2, result.Count);
        }

        [Fact]
        public async Task UpdateAsync_ModifiesClaim()
        {
            var (user, _, policy) = SeedBasicData();

            var claim = new Claim
            {
                UserId = user.Id,
                PolicyId = policy.Id,
                Reason = "Original",
                ClaimAmount = 100,
                Status = ClaimStatus.Pending
            };
            _context.Claims.Add(claim);
            await _context.SaveChangesAsync();

            claim.Status = ClaimStatus.Approved;
            claim.ApprovedAmount = 80;
            await _repository.UpdateAsync(claim);

            var updated = await _context.Claims.FindAsync(claim.Id);
            Assert.Equal(ClaimStatus.Approved, updated!.Status);
            Assert.Equal(80, updated.ApprovedAmount);
        }
    }
}
