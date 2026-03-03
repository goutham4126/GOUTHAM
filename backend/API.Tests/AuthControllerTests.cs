using API.Controllers;
using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace API.Tests
{
    public class AuthControllerTests
    {
        private readonly Mock<IAuthService> _authServiceMock;
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            _authServiceMock = new Mock<IAuthService>();
            _controller = new AuthController(_authServiceMock.Object);
        }

        [Fact]
        public async Task Register_ReturnsCreatedResult()
        {
            var dto = new RegisterDto("John", "Doe", "john@test.com", "Pass123", null, null, null, null);
            var result = new AuthResultDto(Guid.NewGuid(), "John Doe", "john@test.com", "Customer", "token");
            _authServiceMock.Setup(s => s.RegisterAsync(dto)).ReturnsAsync(result);

            var actionResult = await _controller.Register(dto);

            var createdResult = Assert.IsType<CreatedResult>(actionResult);
            var returnedDto = Assert.IsType<AuthResultDto>(createdResult.Value);
            Assert.Equal("John Doe", returnedDto.FullName);
        }

        [Fact]
        public async Task Login_ReturnsOkResult()
        {
            var dto = new LoginDto("john@test.com", "Pass123");
            var result = new AuthResultDto(Guid.NewGuid(), "John Doe", "john@test.com", "Customer", "token");
            _authServiceMock.Setup(s => s.LoginAsync(dto)).ReturnsAsync(result);

            var actionResult = await _controller.Login(dto);

            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var returnedDto = Assert.IsType<AuthResultDto>(okResult.Value);
            Assert.Equal("token", returnedDto.Token);
        }
    }
}
