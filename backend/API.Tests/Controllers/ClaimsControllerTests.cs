using API.Controllers;
using Application.DTOs.Insurance;
using Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using SecurityClaim = System.Security.Claims.Claim;

namespace API.Tests.Controllers
{
    public class ClaimsControllerTests
    {
        private readonly Mock<IClaimService> _claimServiceMock;
        private readonly ClaimsController _controller;
        private readonly Guid _userId;

        public ClaimsControllerTests()
        {
            _claimServiceMock = new Mock<IClaimService>();
            _controller = new ClaimsController(_claimServiceMock.Object);
            _userId = Guid.NewGuid();

            // Simulate authenticated user
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

        [Fact]
        public async Task Create_ReturnsOkWithClaim()
        {
            var request = new CreateClaimRequest(Guid.NewGuid(), "Accident", 1000, "http://doc.url", "hash123");
            var claimDto = new ClaimDto(Guid.NewGuid(), "Accident", 1000, null, "Pending",
                DateTime.UtcNow, null, "John Doe", null, "http://doc.url", "hash123", request.PolicyId);

            _claimServiceMock.Setup(s => s.CreateClaimAsync(
                _userId, request.PolicyId, request.Reason, request.Amount,
                request.DocumentUrl, request.DocumentHash))
                .ReturnsAsync(claimDto);

            var result = await _controller.Create(request);

            var okResult = Assert.IsType<OkObjectResult>(result);
            var returned = Assert.IsType<ClaimDto>(okResult.Value);
            Assert.Equal("Accident", returned.Reason);
        }

        [Fact]
        public async Task MyClaims_ReturnsOkWithClaims()
        {
            var claims = new List<ClaimDto>
            {
                new ClaimDto(Guid.NewGuid(), "R1", 100, null, "Pending", DateTime.UtcNow, null, "A B", null, null, null, Guid.NewGuid())
            };
            _claimServiceMock.Setup(s => s.GetUserClaimsAsync(_userId)).ReturnsAsync(claims);

            var result = await _controller.MyClaims();

            var okResult = Assert.IsType<OkObjectResult>(result);
            var returned = Assert.IsType<List<ClaimDto>>(okResult.Value);
            Assert.Single(returned);
        }

        [Fact]
        public async Task GetAll_ReturnsOkWithAllClaims()
        {
            var claims = new List<ClaimDto>
            {
                new ClaimDto(Guid.NewGuid(), "R1", 100, null, "Pending", DateTime.UtcNow, null, "A B", null, null, null, Guid.NewGuid()),
                new ClaimDto(Guid.NewGuid(), "R2", 200, 150, "Approved", DateTime.UtcNow, DateTime.UtcNow, "C D", "Officer", null, null, Guid.NewGuid())
            };
            _claimServiceMock.Setup(s => s.GetAllClaimsAsync()).ReturnsAsync(claims);

            var result = await _controller.GetAll();

            var okResult = Assert.IsType<OkObjectResult>(result);
            var returned = Assert.IsType<List<ClaimDto>>(okResult.Value);
            Assert.Equal(2, returned.Count);
        }

        [Fact]
        public async Task Approve_ReturnsOkMessage()
        {
            var claimId = Guid.NewGuid();
            var request = new ApproveClaimRequest(800);

            var result = await _controller.Approve(claimId, request);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Claim approved and payout processed", okResult.Value);
            _claimServiceMock.Verify(s => s.ApproveClaimAsync(claimId, 800, _userId), Times.Once);
        }

        [Fact]
        public async Task Reject_ReturnsOkMessage()
        {
            var claimId = Guid.NewGuid();

            var result = await _controller.Reject(claimId);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Claim rejected", okResult.Value);
            _claimServiceMock.Verify(s => s.RejectClaimAsync(claimId, _userId), Times.Once);
        }

        [Fact]
        public async Task MyAssignedClaims_ReturnsOkWithClaims()
        {
            var claims = new List<ClaimDto>
            {
                new ClaimDto(Guid.NewGuid(), "R1", 500, null, "Pending", DateTime.UtcNow, null, "A B", "Officer", null, null, Guid.NewGuid())
            };
            _claimServiceMock.Setup(s => s.GetAssignedClaimsAsync(_userId)).ReturnsAsync(claims);

            var result = await _controller.MyAssignedClaims();

            var okResult = Assert.IsType<OkObjectResult>(result);
            var returned = Assert.IsType<List<ClaimDto>>(okResult.Value);
            Assert.Single(returned);
        }
    }
}
