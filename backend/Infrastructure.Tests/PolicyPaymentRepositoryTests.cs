using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Tests
{
    public class PolicyPaymentRepositoryTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly PolicyPaymentRepository _repository;

        public PolicyPaymentRepositoryTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _repository = new PolicyPaymentRepository(_context);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        private Policy SeedPolicy()
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
            return policy;
        }

        [Fact]
        public async Task AddAsync_AddsPaymentToDatabase()
        {
            var policy = SeedPolicy();

            var payment = new PolicyPayment
            {
                PolicyId = policy.Id,
                Amount = 100,
                DueDate = DateTime.UtcNow,
                Status = PaymentStatus.Pending
            };

            await _repository.AddAsync(payment);

            var found = await _context.PolicyPayments.FindAsync(payment.Id);
            Assert.NotNull(found);
            Assert.Equal(100, found!.Amount);
        }

        [Fact]
        public async Task GetByIdAsync_Existing_ReturnsPayment()
        {
            var policy = SeedPolicy();
            var payment = new PolicyPayment { PolicyId = policy.Id, Amount = 50, DueDate = DateTime.UtcNow };
            _context.PolicyPayments.Add(payment);
            await _context.SaveChangesAsync();

            var result = await _repository.GetByIdAsync(payment.Id);

            Assert.NotNull(result);
            Assert.Equal(50, result!.Amount);
        }

        [Fact]
        public async Task GetByIdAsync_NonExisting_ReturnsNull()
        {
            var result = await _repository.GetByIdAsync(Guid.NewGuid());
            Assert.Null(result);
        }

        [Fact]
        public async Task GetByPolicyIdAsync_ReturnsPaymentsForPolicy()
        {
            var policy = SeedPolicy();

            _context.PolicyPayments.AddRange(
                new PolicyPayment { PolicyId = policy.Id, Amount = 100, DueDate = DateTime.UtcNow },
                new PolicyPayment { PolicyId = policy.Id, Amount = 100, DueDate = DateTime.UtcNow.AddMonths(1) }
            );
            await _context.SaveChangesAsync();

            var result = await _repository.GetByPolicyIdAsync(policy.Id);

            Assert.Equal(2, result.Count);
        }

        [Fact]
        public async Task UpdateAsync_ModifiesPayment()
        {
            var policy = SeedPolicy();
            var payment = new PolicyPayment
            {
                PolicyId = policy.Id,
                Amount = 100,
                DueDate = DateTime.UtcNow,
                Status = PaymentStatus.Pending
            };
            _context.PolicyPayments.Add(payment);
            await _context.SaveChangesAsync();

            payment.Status = PaymentStatus.Paid;
            payment.PaidDate = DateTime.UtcNow;
            await _repository.UpdateAsync(payment);

            var updated = await _context.PolicyPayments.FindAsync(payment.Id);
            Assert.Equal(PaymentStatus.Paid, updated!.Status);
            Assert.NotNull(updated.PaidDate);
        }
    }
}
