using Application.DTOs;
using Application.Interfaces;
using Application.Services;
using Domain.Entities;
using Domain.Enums;
using Moq;

namespace Application.Tests.Services
{
    public class AuthServiceTests
    {
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IPasswordService> _passwordServiceMock;
        private readonly Mock<IJwtService> _jwtServiceMock;
        private readonly Mock<IVercelBlobService> _blobMock;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            _userRepoMock = new Mock<IUserRepository>();
            _passwordServiceMock = new Mock<IPasswordService>();
            _jwtServiceMock = new Mock<IJwtService>();
            _blobMock = new Mock<IVercelBlobService>();
            _authService = new AuthService(
                _userRepoMock.Object,
                _passwordServiceMock.Object,
                _jwtServiceMock.Object,
                _blobMock.Object);
        }

        // ── Register ──

        [Fact]
        public async Task RegisterAsync_Success_ReturnsAuthResult()
        {
            var dto = new RegisterDto("John", "Doe", "John@Test.Com", "Password123",
                "GOV1", "123 Main", "555-1234", new DateTime(1990, 1, 1));

            _userRepoMock.Setup(r => r.EmailExistsAsync("john@test.com")).ReturnsAsync(false);
            _passwordServiceMock.Setup(p => p.HashPassword("Password123")).Returns("hashed_pw");
            _jwtServiceMock.Setup(j => j.GenerateToken(It.IsAny<User>())).Returns("jwt_token");

            var result = await _authService.RegisterAsync(dto);

            Assert.Equal("John Doe", result.FullName);
            Assert.Equal("john@test.com", result.Email);
            Assert.Equal("Customer", result.Role);
            Assert.Equal("jwt_token", result.Token);
            _userRepoMock.Verify(r => r.AddAsync(It.Is<User>(u =>
                u.FirstName == "John" &&
                u.LastName == "Doe" &&
                u.Email == "john@test.com" &&
                u.PasswordHash == "hashed_pw" &&
                u.Role == UserRole.Customer)), Times.Once);
        }

        [Fact]
        public async Task RegisterAsync_DuplicateEmail_ThrowsInvalidOperation()
        {
            var dto = new RegisterDto("John", "Doe", "existing@test.com", "Password123",
                null, null, null, null);

            _userRepoMock.Setup(r => r.EmailExistsAsync("existing@test.com")).ReturnsAsync(true);

            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _authService.RegisterAsync(dto));
        }

        [Fact]
        public async Task RegisterAsync_TrimsAndLowercasesEmail()
        {
            var dto = new RegisterDto("  Jane ", " Doe ", "  UPPER@TEST.COM  ", "pass",
                null, null, null, null);

            _userRepoMock.Setup(r => r.EmailExistsAsync("upper@test.com")).ReturnsAsync(false);
            _passwordServiceMock.Setup(p => p.HashPassword(It.IsAny<string>())).Returns("h");
            _jwtServiceMock.Setup(j => j.GenerateToken(It.IsAny<User>())).Returns("t");

            var result = await _authService.RegisterAsync(dto);

            Assert.Equal("upper@test.com", result.Email);
            Assert.Equal("Jane Doe", result.FullName);
        }

        // ── Login ──

        [Fact]
        public async Task LoginAsync_Success_ReturnsAuthResult()
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = "John",
                LastName = "Doe",
                Email = "john@test.com",
                PasswordHash = "hashed_pw",
                Role = UserRole.Customer,
                IsDeleted = false
            };

            _userRepoMock.Setup(r => r.GetByEmailAsync("john@test.com")).ReturnsAsync(user);
            _passwordServiceMock.Setup(p => p.VerifyPassword("Password123", "hashed_pw")).Returns(true);
            _jwtServiceMock.Setup(j => j.GenerateToken(user)).Returns("jwt_token");

            var dto = new LoginDto("john@test.com", "Password123");
            var result = await _authService.LoginAsync(dto);

            Assert.Equal(user.Id, result.UserId);
            Assert.Equal("John Doe", result.FullName);
            Assert.Equal("jwt_token", result.Token);
        }

        [Fact]
        public async Task LoginAsync_UserNotFound_ThrowsUnauthorized()
        {
            _userRepoMock.Setup(r => r.GetByEmailAsync("missing@test.com")).ReturnsAsync((User?)null);

            var dto = new LoginDto("missing@test.com", "Password123");

            await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _authService.LoginAsync(dto));
        }

        [Fact]
        public async Task LoginAsync_DeletedUser_ThrowsUnauthorized()
        {
            var user = new User
            {
                Email = "deleted@test.com",
                PasswordHash = "h",
                IsDeleted = true
            };
            _userRepoMock.Setup(r => r.GetByEmailAsync("deleted@test.com")).ReturnsAsync(user);

            var dto = new LoginDto("deleted@test.com", "pass");

            await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _authService.LoginAsync(dto));
        }

        [Fact]
        public async Task LoginAsync_WrongPassword_ThrowsUnauthorized()
        {
            var user = new User
            {
                Email = "john@test.com",
                PasswordHash = "hashed_pw",
                IsDeleted = false
            };
            _userRepoMock.Setup(r => r.GetByEmailAsync("john@test.com")).ReturnsAsync(user);
            _passwordServiceMock.Setup(p => p.VerifyPassword("wrong", "hashed_pw")).Returns(false);

            var dto = new LoginDto("john@test.com", "wrong");

            await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _authService.LoginAsync(dto));
        }
    }
}
