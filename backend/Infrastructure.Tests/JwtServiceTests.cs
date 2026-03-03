using Domain.Entities;
using Domain.Enums;
using Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Infrastructure.Tests
{
    public class JwtServiceTests
    {
        private readonly JwtService _service;

        public JwtServiceTests()
        {
            var config = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    { "Jwt:Key", "ThisIsAVeryLongSecretKeyForTestingPurposesOnly1234567890!" },
                    { "Jwt:ExpiresMinutes", "60" },
                    { "Jwt:Issuer", "TestIssuer" },
                    { "Jwt:Audience", "TestAudience" }
                })
                .Build();

            _service = new JwtService(config);
        }

        [Fact]
        public void GenerateToken_ReturnsNonEmptyString()
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = "John",
                LastName = "Doe",
                Email = "john@test.com",
                PasswordHash = "h",
                Role = UserRole.Customer
            };

            var token = _service.GenerateToken(user);

            Assert.False(string.IsNullOrEmpty(token));
        }

        [Fact]
        public void GenerateToken_ContainsExpectedClaims()
        {
            var userId = Guid.NewGuid();
            var user = new User
            {
                Id = userId,
                FirstName = "Jane",
                LastName = "Smith",
                Email = "jane@test.com",
                PasswordHash = "h",
                Role = UserRole.Admin
            };

            var token = _service.GenerateToken(user);

            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            // JWT handler maps ClaimTypes URIs to short names
            Assert.Equal(userId.ToString(), jwtToken.Claims.First(c => c.Type == "nameid").Value);
            Assert.Equal("jane@test.com", jwtToken.Claims.First(c => c.Type == "email").Value);
            Assert.Equal("Jane Smith", jwtToken.Claims.First(c => c.Type == "unique_name").Value);
            Assert.Equal("Admin", jwtToken.Claims.First(c => c.Type == "role").Value);
        }

        [Fact]
        public void GenerateToken_HasCorrectIssuerAndAudience()
        {
            var user = new User
            {
                FirstName = "A",
                LastName = "B",
                Email = "a@b.com",
                PasswordHash = "h",
                Role = UserRole.Agent
            };

            var token = _service.GenerateToken(user);

            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            Assert.Equal("TestIssuer", jwtToken.Issuer);
            Assert.Contains("TestAudience", jwtToken.Audiences);
        }

        [Fact]
        public void GenerateToken_DifferentUsers_ProduceDifferentTokens()
        {
            var user1 = new User { FirstName = "A", LastName = "B", Email = "a@b.com", PasswordHash = "h", Role = UserRole.Customer };
            var user2 = new User { FirstName = "C", LastName = "D", Email = "c@d.com", PasswordHash = "h", Role = UserRole.Admin };

            var token1 = _service.GenerateToken(user1);
            var token2 = _service.GenerateToken(user2);

            Assert.NotEqual(token1, token2);
        }
    }
}
