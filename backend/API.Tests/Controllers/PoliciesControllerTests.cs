using API.Controllers;
using Application.DTOs.Insurance;
using Application.Interfaces;
using Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using SecurityClaim = System.Security.Claims.Claim;

namespace API.Tests.Controllers
{
    public class PoliciesControllerTests
    {
        private readonly Mock<IPolicyService> _policyServiceMock;
        private readonly PoliciesController _controller;
        private readonly Guid _userId;

        public PoliciesControllerTests()
        {
            _policyServiceMock = new Mock<IPolicyService>();
            _controller = new PoliciesController(_policyServiceMock.Object);
            _userId = Guid.NewGuid();

            var claims = new List<SecurityClaim>
            {
                new SecurityClaim(ClaimTypes.NameIdentifier, _userId.ToString()),
                new SecurityClaim(ClaimTypes.Role, "Customer")
            };
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };
        }

        private PlanDto CreatePlanDto() =>
            new PlanDto(Guid.NewGuid(), "Gold", "D", 100, 50000, 12, "Monthly", "Health");

        private PolicyDto CreatePolicyDto(Guid? id = null) =>
            new PolicyDto(
                id ?? Guid.NewGuid(),
                DateTime.UtcNow,
                DateTime.UtcNow.AddMonths(12),
                12, "Monthly", "Active",
                1200, 100, 50000, 50000, 100,
                CreatePlanDto(),
                "John Doe", "Agent Smith",
                new List<PolicyPaymentDto>());

        [Fact]
        public async Task Purchase_ReturnsOkWithPolicy()
        {
            var requestId = Guid.NewGuid();
            var policyDto = CreatePolicyDto();

            _policyServiceMock.Setup(s => s.PurchasePolicyAsync(_userId, requestId))
                .ReturnsAsync(policyDto);

            var result = await _controller.Purchase(requestId);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.IsType<PolicyDto>(okResult.Value);
        }

        [Fact]
        public async Task MyPolicies_ReturnsOkWithPolicies()
        {
            var policies = new List<PolicyDto> { CreatePolicyDto() };
            _policyServiceMock.Setup(s => s.GetUserPoliciesAsync(_userId)).ReturnsAsync(policies);

            var result = await _controller.MyPolicies();

            var okResult = Assert.IsType<OkObjectResult>(result);
            var returned = Assert.IsType<List<PolicyDto>>(okResult.Value);
            Assert.Single(returned);
        }

        [Fact]
        public async Task GetPolicy_Found_ReturnsOk()
        {
            var policyId = Guid.NewGuid();
            var policyDto = CreatePolicyDto(policyId);
            _policyServiceMock.Setup(s => s.GetPolicyAsync(policyId, _userId, "Customer")).ReturnsAsync(policyDto);

            var result = await _controller.GetPolicy(policyId);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.IsType<PolicyDto>(okResult.Value);
        }

        [Fact]
        public async Task GetPolicy_NotFound_ReturnsNotFound()
        {
            _policyServiceMock.Setup(s => s.GetPolicyAsync(It.IsAny<Guid>(), _userId, "Customer")).ReturnsAsync((PolicyDto?)null);

            var result = await _controller.GetPolicy(Guid.NewGuid());

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Pay_ReturnsOkMessage()
        {
            var paymentId = Guid.NewGuid();

            var result = await _controller.Pay(paymentId);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Payment marked as paid", okResult.Value);
            _policyServiceMock.Verify(s => s.MarkPaymentAsPaidAsync(paymentId, _userId), Times.Once);
        }

        [Fact]
        public async Task MyAssignedPolicies_ReturnsOk()
        {
            var policies = new List<PolicyDto> { CreatePolicyDto() };
            _policyServiceMock.Setup(s => s.GetAssignedPoliciesAsync(_userId)).ReturnsAsync(policies);

            var result = await _controller.MyAssignedPolicies();

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.IsType<List<PolicyDto>>(okResult.Value);
        }

        [Fact]
        public async Task GetAllPolicies_ReturnsOk()
        {
            var policies = new List<PolicyDto> { CreatePolicyDto(), CreatePolicyDto() };
            _policyServiceMock.Setup(s => s.GetAllPoliciesAsync()).ReturnsAsync(policies);

            var result = await _controller.GetAllPolicies();

            var okResult = Assert.IsType<OkObjectResult>(result);
            var returned = Assert.IsType<List<PolicyDto>>(okResult.Value);
            Assert.Equal(2, returned.Count);
        }
    }
}
