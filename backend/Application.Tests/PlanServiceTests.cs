using Application.DTOs.Insurance;
using Application.Interfaces;
using Application.Services;
using Domain.Entities;
using Moq;

namespace Application.Tests
{
    public class PlanServiceTests
    {
        private readonly Mock<IPlanRepository> _repoMock;
        private readonly PlanService _service;

        public PlanServiceTests()
        {
            _repoMock = new Mock<IPlanRepository>();
            _service = new PlanService(_repoMock.Object);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsAllPlans()
        {
            var plans = new List<Plan>
            {
                new Plan { Name = "Gold", Description = "D1", PremiumAmount = 100, CoverageAmount = 50000, DurationInMonths = 12, PaymentFrequency = "Monthly", PlanType = "Health" },
                new Plan { Name = "Silver", Description = "D2", PremiumAmount = 50, CoverageAmount = 25000, DurationInMonths = 6, PaymentFrequency = "Quarterly", PlanType = "Life" }
            };
            _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(plans);

            var result = await _service.GetAllAsync();

            Assert.Equal(2, result.Count);
            Assert.Equal("Gold", result[0].Name);
            Assert.Equal("Silver", result[1].Name);
        }

        [Fact]
        public async Task GetByIdAsync_Found_ReturnsPlan()
        {
            var id = Guid.NewGuid();
            var plan = new Plan { Id = id, Name = "Gold", Description = "D", PremiumAmount = 100, CoverageAmount = 50000, DurationInMonths = 12, PaymentFrequency = "Monthly", PlanType = "Health" };
            _repoMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(plan);

            var result = await _service.GetByIdAsync(id);

            Assert.NotNull(result);
            Assert.Equal(id, result!.Id);
            Assert.Equal("Gold", result.Name);
        }

        [Fact]
        public async Task GetByIdAsync_NotFound_ReturnsNull()
        {
            _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Plan?)null);

            var result = await _service.GetByIdAsync(Guid.NewGuid());

            Assert.Null(result);
        }

        [Fact]
        public async Task CreateAsync_Success_ReturnsPlanDto()
        {
            var dto = new CreatePlanDto("Gold", "Premium", 100, 50000, 12, "Monthly", "Health");

            var result = await _service.CreateAsync(dto);

            Assert.Equal("Gold", result.Name);
            Assert.Equal(100, result.PremiumAmount);
            _repoMock.Verify(r => r.AddAsync(It.Is<Plan>(p => p.Name == "Gold")), Times.Once);
        }

        [Fact]
        public async Task UpdateAsync_Found_UpdatesPlan()
        {
            var id = Guid.NewGuid();
            var existing = new Plan { Id = id, Name = "Old", Description = "D", PremiumAmount = 50, CoverageAmount = 25000, DurationInMonths = 6, PaymentFrequency = "Monthly", PlanType = "Health" };
            _repoMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(existing);

            var dto = new CreatePlanDto("New", "Updated", 200, 100000, 24, "Yearly", "Life");

            await _service.UpdateAsync(id, dto);

            Assert.Equal("New", existing.Name);
            Assert.Equal(200, existing.PremiumAmount);
            _repoMock.Verify(r => r.UpdateAsync(existing), Times.Once);
        }

        [Fact]
        public async Task UpdateAsync_NotFound_ThrowsException()
        {
            _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Plan?)null);

            await Assert.ThrowsAsync<Exception>(
                () => _service.UpdateAsync(Guid.NewGuid(), new CreatePlanDto("X", "X", 1, 1, 1, "M", "H")));
        }

        [Fact]
        public async Task DeleteAsync_Found_DeletesPlan()
        {
            var id = Guid.NewGuid();
            var plan = new Plan { Id = id, Name = "Gold", Description = "D", PremiumAmount = 100, CoverageAmount = 50000, DurationInMonths = 12, PaymentFrequency = "Monthly", PlanType = "Health" };
            _repoMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(plan);

            await _service.DeleteAsync(id);

            _repoMock.Verify(r => r.DeleteAsync(plan), Times.Once);
        }

        [Fact]
        public async Task DeleteAsync_NotFound_ThrowsException()
        {
            _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Plan?)null);

            await Assert.ThrowsAsync<Exception>(() => _service.DeleteAsync(Guid.NewGuid()));
        }
    }
}
