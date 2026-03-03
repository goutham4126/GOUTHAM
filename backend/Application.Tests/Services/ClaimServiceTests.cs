using Application.Interfaces;
using Application.Services;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace Application.Tests.Services
{
    public class ClaimServiceTests
    {
        private readonly Mock<IClaimRepository> _claimRepoMock;
        private readonly Mock<IPolicyRepository> _policyRepoMock;
        private readonly Mock<IAppDbContext> _contextMock;
        private readonly Mock<IVercelBlobService> _blobMock;
        private readonly Mock<IInvoiceGeneratorService> _invoiceMock;
        private readonly Mock<ILogger<ClaimService>> _loggerMock;
        private readonly Mock<INotificationService> _notificationMock;
        private readonly ClaimService _service;

        public ClaimServiceTests()
        {
            _claimRepoMock = new Mock<IClaimRepository>();
            _policyRepoMock = new Mock<IPolicyRepository>();
            _contextMock = new Mock<IAppDbContext>();
            _blobMock = new Mock<IVercelBlobService>();
            _invoiceMock = new Mock<IInvoiceGeneratorService>();
            _loggerMock = new Mock<ILogger<ClaimService>>();
            _notificationMock = new Mock<INotificationService>();

            _service = new ClaimService(
                _claimRepoMock.Object,
                _policyRepoMock.Object,
                _contextMock.Object,
                _blobMock.Object,
                _invoiceMock.Object,
                _loggerMock.Object,
                _notificationMock.Object);
        }

        [Fact]
        public async Task GetUserClaimsAsync_ReturnsSortedClaims()
        {
            var userId = Guid.NewGuid();
            var user = new User { Id = userId, FirstName = "John", LastName = "Doe", Email = "j@t.com", PasswordHash = "h" };
            var claims = new List<Claim>
            {
                new Claim { UserId = userId, User = user, Reason = "R1", ClaimAmount = 100, SubmittedAt = DateTime.UtcNow.AddDays(-2) },
                new Claim { UserId = userId, User = user, Reason = "R2", ClaimAmount = 200, SubmittedAt = DateTime.UtcNow }
            };

            _claimRepoMock.Setup(r => r.GetByUserIdAsync(userId)).ReturnsAsync(claims);

            var result = await _service.GetUserClaimsAsync(userId);

            Assert.Equal(2, result.Count);
            // Most recent first
            Assert.Equal("R2", result[0].Reason);
            Assert.Equal("R1", result[1].Reason);
        }

        [Fact]
        public async Task GetAllClaimsAsync_ReturnsAllClaims()
        {
            var user = new User { FirstName = "A", LastName = "B", Email = "a@b.com", PasswordHash = "h" };
            var claims = new List<Claim>
            {
                new Claim { User = user, Reason = "R1", ClaimAmount = 100, SubmittedAt = DateTime.UtcNow },
                new Claim { User = user, Reason = "R2", ClaimAmount = 200, SubmittedAt = DateTime.UtcNow.AddDays(-1) }
            };

            _claimRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(claims);

            var result = await _service.GetAllClaimsAsync();

            Assert.Equal(2, result.Count);
        }

        [Fact]
        public async Task ApproveClaimAsync_Success_UpdatesClaimAndCreatesPayment()
        {
            var claimId = Guid.NewGuid();
            var officerId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var user = new User { Id = userId, FirstName = "C", LastName = "D", Email = "c@d.com", PasswordHash = "h" };
            var claim = new Claim
            {
                Id = claimId,
                ClaimOfficerId = officerId,
                UserId = userId,
                PolicyId = Guid.NewGuid(),
                Reason = "Test",
                ClaimAmount = 1000,
                Status = ClaimStatus.Pending,
                User = user
            };

            _claimRepoMock.Setup(r => r.GetByIdAsync(claimId)).ReturnsAsync(claim);

            var claimPaymentsDbSetMock = new Mock<DbSet<ClaimPayment>>();
            _contextMock.Setup(c => c.ClaimPayments).Returns(claimPaymentsDbSetMock.Object);

            // Mock invoice generation (may fail silently)
            _policyRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Policy?)null);

            var invoicesDbSetMock = new Mock<DbSet<Invoice>>();
            _contextMock.Setup(c => c.Invoices).Returns(invoicesDbSetMock.Object);
            _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

            var usersDbSetMock = new Mock<DbSet<User>>();
            _contextMock.Setup(c => c.Users).Returns(usersDbSetMock.Object);

            await _service.ApproveClaimAsync(claimId, 800m, officerId);

            Assert.Equal(ClaimStatus.Approved, claim.Status);
            Assert.Equal(800m, claim.ApprovedAmount);
            Assert.NotNull(claim.ProcessedAt);
            _claimRepoMock.Verify(r => r.UpdateAsync(claim), Times.Once);
            _notificationMock.Verify(n => n.SendNotificationAsync(userId, "Claim Approved", It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task ApproveClaimAsync_NotAssigned_ThrowsUnauthorized()
        {
            var claimId = Guid.NewGuid();
            var claim = new Claim
            {
                Id = claimId,
                ClaimOfficerId = Guid.NewGuid(), // different officer
                Reason = "Test",
                ClaimAmount = 100
            };
            _claimRepoMock.Setup(r => r.GetByIdAsync(claimId)).ReturnsAsync(claim);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _service.ApproveClaimAsync(claimId, 50m, Guid.NewGuid()));
        }

        [Fact]
        public async Task ApproveClaimAsync_NotFound_ThrowsException()
        {
            _claimRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Claim?)null);

            await Assert.ThrowsAsync<Exception>(
                () => _service.ApproveClaimAsync(Guid.NewGuid(), 100m, Guid.NewGuid()));
        }

        [Fact]
        public async Task RejectClaimAsync_Success_SetsRejectedStatus()
        {
            var claimId = Guid.NewGuid();
            var officerId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var user = new User { Id = userId, FirstName = "E", LastName = "F", Email = "e@f.com", PasswordHash = "h" };
            var claim = new Claim
            {
                Id = claimId,
                ClaimOfficerId = officerId,
                UserId = userId,
                PolicyId = Guid.NewGuid(),
                Reason = "Test",
                ClaimAmount = 1000,
                Status = ClaimStatus.Pending,
                User = user
            };

            _claimRepoMock.Setup(r => r.GetByIdAsync(claimId)).ReturnsAsync(claim);
            _policyRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Policy?)null);

            var invoicesDbSetMock = new Mock<DbSet<Invoice>>();
            _contextMock.Setup(c => c.Invoices).Returns(invoicesDbSetMock.Object);
            _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

            var usersDbSetMock = new Mock<DbSet<User>>();
            _contextMock.Setup(c => c.Users).Returns(usersDbSetMock.Object);

            await _service.RejectClaimAsync(claimId, officerId);

            Assert.Equal(ClaimStatus.Rejected, claim.Status);
            Assert.NotNull(claim.ProcessedAt);
            _claimRepoMock.Verify(r => r.UpdateAsync(claim), Times.Once);
            _notificationMock.Verify(n => n.SendNotificationAsync(userId, "Claim Rejected", It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task RejectClaimAsync_NotAssigned_ThrowsUnauthorized()
        {
            var claimId = Guid.NewGuid();
            var claim = new Claim
            {
                Id = claimId,
                ClaimOfficerId = Guid.NewGuid(),
                Reason = "Test",
                ClaimAmount = 100
            };
            _claimRepoMock.Setup(r => r.GetByIdAsync(claimId)).ReturnsAsync(claim);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _service.RejectClaimAsync(claimId, Guid.NewGuid()));
        }
    }
}
