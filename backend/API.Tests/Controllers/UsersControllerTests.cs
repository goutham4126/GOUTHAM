using API.Controllers;
using Application.DTOs.Users;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using SecurityClaim = System.Security.Claims.Claim;

namespace API.Tests.Controllers
{
    public class UsersControllerTests
    {
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IAuthService> _authServiceMock;
        private readonly UsersController _controller;
        private readonly Guid _userId;

        public UsersControllerTests()
        {
            _userRepoMock = new Mock<IUserRepository>();
            _authServiceMock = new Mock<IAuthService>();
            _controller = new UsersController(_userRepoMock.Object, _authServiceMock.Object);
            _userId = Guid.NewGuid();

            var claims = new List<SecurityClaim>
            {
                new SecurityClaim(ClaimTypes.NameIdentifier, _userId.ToString()),
                new SecurityClaim(ClaimTypes.Role, "Admin")
            };
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };
        }

        private User CreateUser(Guid? id = null) => new User
        {
            Id = id ?? Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john@test.com",
            PasswordHash = "h",
            Role = UserRole.Customer,
            CreatedAt = DateTime.UtcNow
        };

        [Fact]
        public async Task GetCurrentUser_Found_ReturnsOkWithUserDto()
        {
            var user = CreateUser(_userId);
            _userRepoMock.Setup(r => r.GetByIdAsync(_userId)).ReturnsAsync(user);

            var result = await _controller.GetCurrentUser();

            var okResult = Assert.IsType<OkObjectResult>(result);
            var dto = Assert.IsType<UserDto>(okResult.Value);
            Assert.Equal("John", dto.FirstName);
        }

        [Fact]
        public async Task GetCurrentUser_NotFound_ThrowsKeyNotFound()
        {
            _userRepoMock.Setup(r => r.GetByIdAsync(_userId)).ReturnsAsync((User?)null);

            await Assert.ThrowsAsync<KeyNotFoundException>(() => _controller.GetCurrentUser());
        }

        [Fact]
        public async Task UpdateProfile_Found_ReturnsOkWithUpdatedUser()
        {
            var user = CreateUser(_userId);
            _userRepoMock.Setup(r => r.GetByIdAsync(_userId)).ReturnsAsync(user);

            var dto = new UpdateProfileDto("Jane", "Smith", "555-9999", "456 Oak Ave", "GOV456", new DateTime(1985, 6, 15));

            var result = await _controller.UpdateProfile(dto);

            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedDto = Assert.IsType<UserDto>(okResult.Value);
            Assert.Equal("Jane", returnedDto.FirstName);
            Assert.Equal("Smith", returnedDto.LastName);
            _userRepoMock.Verify(r => r.UpdateAsync(user), Times.Once);
        }

        [Fact]
        public async Task UpdateProfile_NotFound_ReturnsNotFound()
        {
            _userRepoMock.Setup(r => r.GetByIdAsync(_userId)).ReturnsAsync((User?)null);

            var dto = new UpdateProfileDto("Jane", "Smith", null, null, null, null);

            var result = await _controller.UpdateProfile(dto);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task GetAllUsers_ReturnsOkWithUsers()
        {
            var users = new List<User> { CreateUser(), CreateUser() };
            _userRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(users);

            var result = await _controller.GetAllUsers();

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task UpdateRole_Found_ReturnsOkMessage()
        {
            var targetUserId = Guid.NewGuid();
            var user = CreateUser(targetUserId);
            _userRepoMock.Setup(r => r.GetByIdAsync(targetUserId)).ReturnsAsync(user);

            var dto = new UpdateRoleDto { Role = UserRole.Agent };

            var result = await _controller.UpdateRole(targetUserId, dto);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Role updated successfully.", okResult.Value);
            Assert.Equal(UserRole.Agent, user.Role);
        }

        [Fact]
        public async Task UpdateRole_NotFound_ReturnsNotFound()
        {
            _userRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((User?)null);

            var dto = new UpdateRoleDto { Role = UserRole.Agent };
            var result = await _controller.UpdateRole(Guid.NewGuid(), dto);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task DeleteUser_Found_ReturnsOkMessage()
        {
            var targetUserId = Guid.NewGuid();
            var user = CreateUser(targetUserId);
            _userRepoMock.Setup(r => r.GetByIdAsync(targetUserId)).ReturnsAsync(user);

            var result = await _controller.DeleteUser(targetUserId);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("User deleted successfully.", okResult.Value);
            _userRepoMock.Verify(r => r.DeleteAsync(targetUserId), Times.Once);
        }

        [Fact]
        public async Task DeleteUser_NotFound_ReturnsNotFound()
        {
            _userRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((User?)null);

            var result = await _controller.DeleteUser(Guid.NewGuid());

            Assert.IsType<NotFoundObjectResult>(result);
        }
    }
}
