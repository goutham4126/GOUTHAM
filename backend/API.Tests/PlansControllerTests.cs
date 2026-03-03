using API.Controllers;
using Application.DTOs.Insurance;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace API.Tests
{
    public class PlansControllerTests
    {
        private readonly Mock<IPlanService> _planServiceMock;
        private readonly PlansController _controller;

        public PlansControllerTests()
        {
            _planServiceMock = new Mock<IPlanService>();
            _controller = new PlansController(_planServiceMock.Object);
        }

        [Fact]
        public async Task GetAll_ReturnsOkWithPlans()
        {
            var plans = new List<PlanDto>
            {
                new PlanDto(Guid.NewGuid(), "Gold", "D", 100, 50000, 12, "Monthly", "Health"),
                new PlanDto(Guid.NewGuid(), "Silver", "D", 50, 25000, 6, "Quarterly", "Life")
            };
            _planServiceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(plans);

            var result = await _controller.GetAll();

            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedPlans = Assert.IsType<List<PlanDto>>(okResult.Value);
            Assert.Equal(2, returnedPlans.Count);
        }

        [Fact]
        public async Task Get_Found_ReturnsOk()
        {
            var id = Guid.NewGuid();
            var plan = new PlanDto(id, "Gold", "D", 100, 50000, 12, "Monthly", "Health");
            _planServiceMock.Setup(s => s.GetByIdAsync(id)).ReturnsAsync(plan);

            var result = await _controller.Get(id);

            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedPlan = Assert.IsType<PlanDto>(okResult.Value);
            Assert.Equal("Gold", returnedPlan.Name);
        }

        [Fact]
        public async Task Get_NotFound_ReturnsNotFound()
        {
            _planServiceMock.Setup(s => s.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((PlanDto?)null);

            var result = await _controller.Get(Guid.NewGuid());

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Create_ReturnsOkWithCreatedPlan()
        {
            var dto = new CreatePlanDto("Gold", "Premium", 100, 50000, 12, "Monthly", "Health");
            var created = new PlanDto(Guid.NewGuid(), "Gold", "Premium", 100, 50000, 12, "Monthly", "Health");
            _planServiceMock.Setup(s => s.CreateAsync(dto)).ReturnsAsync(created);

            var result = await _controller.Create(dto);

            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedPlan = Assert.IsType<PlanDto>(okResult.Value);
            Assert.Equal("Gold", returnedPlan.Name);
        }

        [Fact]
        public async Task Update_ReturnsOkMessage()
        {
            var id = Guid.NewGuid();
            var dto = new CreatePlanDto("Updated", "D", 200, 100000, 24, "Yearly", "Life");

            var result = await _controller.Update(id, dto);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Plan updated successfully", okResult.Value);
            _planServiceMock.Verify(s => s.UpdateAsync(id, dto), Times.Once);
        }

        [Fact]
        public async Task Delete_ReturnsOkMessage()
        {
            var id = Guid.NewGuid();

            var result = await _controller.Delete(id);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Plan deactivated", okResult.Value);
            _planServiceMock.Verify(s => s.DeleteAsync(id), Times.Once);
        }
    }
}
