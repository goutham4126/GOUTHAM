using Application.Interfaces;
using Application.Services;
using Domain.Entities;
using Domain.Enums;
using Moq;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
namespace Application.Tests.Services
{
    public class PolicyServiceTests
    {
        private readonly Mock<IAppDbContext> _contextMock;
        private readonly Mock<IPolicyRepository> _policyRepoMock;
        private readonly Mock<IPlanRepository> _planRepoMock;
        private readonly Mock<IPolicyPaymentRepository> _paymentRepoMock;
        private readonly Mock<IPolicyRequestRepository> _policyRequestRepoMock;
        private readonly Mock<IVercelBlobService> _blobMock;
        private readonly Mock<IInvoiceGeneratorService> _invoiceMock;
        private readonly Mock<Microsoft.Extensions.Logging.ILogger<PolicyService>> _loggerMock;
        private readonly Mock<INotificationService> _notificationMock;
        private readonly Mock<IWebhookNotificationService> _webhookNotificationMock;
        private readonly PolicyService _service;

        public PolicyServiceTests()
        {
            _contextMock = new Mock<IAppDbContext>();
            _policyRepoMock = new Mock<IPolicyRepository>();
            _planRepoMock = new Mock<IPlanRepository>();
            _paymentRepoMock = new Mock<IPolicyPaymentRepository>();
            _policyRequestRepoMock = new Mock<IPolicyRequestRepository>();
            _blobMock = new Mock<IVercelBlobService>();
            _invoiceMock = new Mock<IInvoiceGeneratorService>();
            _loggerMock = new Mock<Microsoft.Extensions.Logging.ILogger<PolicyService>>();
            _notificationMock = new Mock<INotificationService>();
            _webhookNotificationMock = new Mock<IWebhookNotificationService>();

            _service = new PolicyService(
                _policyRepoMock.Object,
                _planRepoMock.Object,
                _paymentRepoMock.Object,
                _policyRequestRepoMock.Object,
                _contextMock.Object,
                _blobMock.Object,
                _invoiceMock.Object,
                _loggerMock.Object,
                _notificationMock.Object,
                _webhookNotificationMock.Object);
        }

        [Fact]
        public async Task GetUserPoliciesAsync_ReturnsPolicies()
        {
            var userId = Guid.NewGuid();
            var plan = new Plan { Name = "Gold", Description = "D", PremiumAmount = 100, CoverageAmount = 50000, DurationInMonths = 12, PaymentFrequency = "Monthly", PlanType = "Health" };
            var user = new User { Id = userId, FirstName = "John", LastName = "Doe", Email = "j@t.com", PasswordHash = "h" };

            var policies = new List<Policy>
            {
                new Policy
                {
                    UserId = userId,
                    User = user,
                    Plan = plan,
                    DurationInMonths = 12,
                    PaymentFrequency = PaymentFrequency.Monthly,
                    TotalPremium = 1200,
                    TotalPaid = 100,
                    CoverageAmount = 50000,
                    PlanBaseCoverageAmount = 50000,
                    PlanBasePremiumAmount = 100
                }
            };

            _policyRepoMock.Setup(r => r.GetByUserIdAsync(userId)).ReturnsAsync(policies);

            var result = await _service.GetUserPoliciesAsync(userId);

            Assert.Single(result);
            Assert.Equal("John Doe", result[0].CustomerName);
        }

        [Fact]
        public async Task GetPolicyAsync_CustomerOwnsPolicy_ReturnsDto()
        {
            var userId = Guid.NewGuid();
            var policyId = Guid.NewGuid();
            var plan = new Plan { Name = "G", Description = "D", PremiumAmount = 100, CoverageAmount = 50000, DurationInMonths = 12, PaymentFrequency = "M", PlanType = "H" };
            var user = new User { Id = userId, FirstName = "A", LastName = "B", Email = "a@b.com", PasswordHash = "h" };

            var policy = new Policy
            {
                Id = policyId,
                UserId = userId,
                User = user,
                Plan = plan,
                DurationInMonths = 12,
                PaymentFrequency = PaymentFrequency.Monthly,
                TotalPremium = 1200,
                TotalPaid = 0,
                CoverageAmount = 50000,
                PlanBaseCoverageAmount = 50000,
                PlanBasePremiumAmount = 100
            };

            _policyRepoMock.Setup(r => r.GetByIdAsync(policyId)).ReturnsAsync(policy);

            var result = await _service.GetPolicyAsync(policyId, userId, "Customer");

            Assert.NotNull(result);
            Assert.Equal(policyId, result!.Id);
        }

        [Fact]
        public async Task GetPolicyAsync_CustomerNotOwner_ThrowsUnauthorized()
        {
            var policyOwnerId = Guid.NewGuid();
            var differentUserId = Guid.NewGuid();
            var policyId = Guid.NewGuid();
            var plan = new Plan { Name = "G", Description = "D", PremiumAmount = 100, CoverageAmount = 50000, DurationInMonths = 12, PaymentFrequency = "M", PlanType = "H" };
            var user = new User { Id = policyOwnerId, FirstName = "A", LastName = "B", Email = "a@b.com", PasswordHash = "h" };

            var policy = new Policy
            {
                Id = policyId,
                UserId = policyOwnerId,
                User = user,
                Plan = plan,
                DurationInMonths = 12,
                PaymentFrequency = PaymentFrequency.Monthly,
                TotalPremium = 1200,
                TotalPaid = 0,
                CoverageAmount = 50000,
                PlanBaseCoverageAmount = 50000,
                PlanBasePremiumAmount = 100
            };

            _policyRepoMock.Setup(r => r.GetByIdAsync(policyId)).ReturnsAsync(policy);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _service.GetPolicyAsync(policyId, differentUserId, "Customer"));
        }

        [Fact]
        public async Task GetPolicyAsync_AdminCanAccessAnyPolicy()
        {
            var policyOwnerId = Guid.NewGuid();
            var adminId = Guid.NewGuid();
            var policyId = Guid.NewGuid();
            var plan = new Plan { Name = "G", Description = "D", PremiumAmount = 100, CoverageAmount = 50000, DurationInMonths = 12, PaymentFrequency = "M", PlanType = "H" };
            var user = new User { Id = policyOwnerId, FirstName = "A", LastName = "B", Email = "a@b.com", PasswordHash = "h" };

            var policy = new Policy
            {
                Id = policyId,
                UserId = policyOwnerId,
                User = user,
                Plan = plan,
                DurationInMonths = 12,
                PaymentFrequency = PaymentFrequency.Monthly,
                TotalPremium = 1200,
                TotalPaid = 0,
                CoverageAmount = 50000,
                PlanBaseCoverageAmount = 50000,
                PlanBasePremiumAmount = 100
            };

            _policyRepoMock.Setup(r => r.GetByIdAsync(policyId)).ReturnsAsync(policy);

            // Admin role is not "Customer" so authorization check is skipped
            var result = await _service.GetPolicyAsync(policyId, adminId, "Admin");

            Assert.NotNull(result);
        }

        [Fact]
        public async Task GetPolicyAsync_NotFound_ReturnsNull()
        {
            _policyRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Policy?)null);

            var result = await _service.GetPolicyAsync(Guid.NewGuid(), Guid.NewGuid(), "Customer");

            Assert.Null(result);
        }

        [Fact]
        public async Task MarkPaymentAsPaidAsync_Success_UpdatesPaymentAndPolicy()
        {
            var userId = Guid.NewGuid();
            var policyId = Guid.NewGuid();
            var paymentId = Guid.NewGuid();

            var payment = new PolicyPayment
            {
                Id = paymentId,
                PolicyId = policyId,
                Amount = 200m,
                Status = PaymentStatus.Pending
            };

            var plan = new Plan { Name = "G", Description = "D", PremiumAmount = 100, CoverageAmount = 50000, DurationInMonths = 12, PaymentFrequency = "M", PlanType = "H" };
            var user = new User { Id = userId, FirstName = "A", LastName = "B", Email = "a@b.com", PasswordHash = "h" };

            var policy = new Policy
            {
                Id = policyId,
                UserId = userId,
                TotalPaid = 200m,
                User = user,
                Plan = plan,
                DurationInMonths = 12,
                PaymentFrequency = PaymentFrequency.Monthly,
                TotalPremium = 1200,
                CoverageAmount = 50000,
                PlanBaseCoverageAmount = 50000,
                PlanBasePremiumAmount = 100
            };

            _paymentRepoMock.Setup(r => r.GetByIdAsync(paymentId)).ReturnsAsync(payment);
            _policyRepoMock.Setup(r => r.GetByIdAsync(policyId)).ReturnsAsync(policy);

            var usersDbSetMock = new Mock<Microsoft.EntityFrameworkCore.DbSet<User>>();
            _contextMock.Setup(c => c.Users).Returns(usersDbSetMock.Object);

            var invoicesDbSetMock = new Mock<Microsoft.EntityFrameworkCore.DbSet<Invoice>>();
            _contextMock.Setup(c => c.Invoices).Returns(invoicesDbSetMock.Object);
            _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

            await _service.MarkPaymentAsPaidAsync(paymentId, userId);

            Assert.Equal(PaymentStatus.Paid, payment.Status);
            Assert.NotNull(payment.PaidDate);
            Assert.Equal(400m, policy.TotalPaid); // 200 original + 200 payment
            _paymentRepoMock.Verify(r => r.UpdateAsync(payment), Times.Once);
            _policyRepoMock.Verify(r => r.UpdateAsync(policy), Times.Once);
            _notificationMock.Verify(n => n.SendNotificationAsync(userId, "Payment Received", It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task MarkPaymentAsPaidAsync_NotYourPolicy_ThrowsUnauthorized()
        {
            var paymentId = Guid.NewGuid();
            var policyId = Guid.NewGuid();

            var payment = new PolicyPayment { Id = paymentId, PolicyId = policyId, Amount = 100 };
            var policy = new Policy
            {
                Id = policyId,
                UserId = Guid.NewGuid(), // different owner
                User = new User { FirstName = "X", LastName = "Y", Email = "x@y.com", PasswordHash = "h" },
                Plan = new Plan { Name = "P", Description = "D", PremiumAmount = 1, CoverageAmount = 1, DurationInMonths = 1, PaymentFrequency = "M", PlanType = "H" },
                DurationInMonths = 1,
                PaymentFrequency = PaymentFrequency.Monthly,
                TotalPremium = 1,
                TotalPaid = 0,
                CoverageAmount = 1,
                PlanBaseCoverageAmount = 1,
                PlanBasePremiumAmount = 1
            };

            _paymentRepoMock.Setup(r => r.GetByIdAsync(paymentId)).ReturnsAsync(payment);
            _policyRepoMock.Setup(r => r.GetByIdAsync(policyId)).ReturnsAsync(policy);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _service.MarkPaymentAsPaidAsync(paymentId, Guid.NewGuid()));
        }

        [Fact]
        public async Task MarkPaymentAsPaidAsync_PaymentNotFound_ThrowsException()
        {
            _paymentRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((PolicyPayment?)null);

            await Assert.ThrowsAsync<Exception>(
                () => _service.MarkPaymentAsPaidAsync(Guid.NewGuid(), Guid.NewGuid()));
        }
    }
}
