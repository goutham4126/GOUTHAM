using Application.Services;

namespace Application.Tests.Services
{
    public class PasswordServiceTests
    {
        private readonly PasswordService _service;

        public PasswordServiceTests()
        {
            _service = new PasswordService();
        }

        [Fact]
        public void HashPassword_ReturnsNonEmptyHash()
        {
            var hash = _service.HashPassword("MySecurePassword123!");

            Assert.False(string.IsNullOrEmpty(hash));
            Assert.NotEqual("MySecurePassword123!", hash);
        }

        [Fact]
        public void HashPassword_DifferentCallsProduceDifferentHashes()
        {
            var hash1 = _service.HashPassword("Password");
            var hash2 = _service.HashPassword("Password");

            // BCrypt generates different salts each time
            Assert.NotEqual(hash1, hash2);
        }

        [Fact]
        public void VerifyPassword_CorrectPassword_ReturnsTrue()
        {
            var password = "TestPassword123!";
            var hash = _service.HashPassword(password);

            Assert.True(_service.VerifyPassword(password, hash));
        }

        [Fact]
        public void VerifyPassword_WrongPassword_ReturnsFalse()
        {
            var hash = _service.HashPassword("CorrectPassword");

            Assert.False(_service.VerifyPassword("WrongPassword", hash));
        }
    }
}
