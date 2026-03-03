using Domain.Entities;
using Domain.Enums;

namespace Domain.Tests.Entities
{
    public class UserTests
    {
        [Fact]
        public void User_DefaultValues_AreCorrect()
        {
            var user = new User();

            Assert.NotEqual(Guid.Empty, user.Id);
            Assert.Equal(UserRole.Customer, user.Role);
            Assert.False(user.IsDeleted);
            Assert.Empty(user.Policies);
            Assert.Empty(user.Claims);
            Assert.Empty(user.Invoices);
            Assert.Empty(user.Notifications);
        }

        [Fact]
        public void User_SetProperties_RetainsValues()
        {
            var id = Guid.NewGuid();
            var user = new User
            {
                FirstName = "John",
                LastName = "Doe",
                Email = "john@test.com",
                PasswordHash = "hashed",
                Role = UserRole.Admin,
                GovernmentId = "GOV123",
                Address = "123 Main St",
                Phone = "1234567890",
                DateOfBirth = new DateTime(1990, 1, 1),
                IsDeleted = true
            };

            Assert.Equal("John", user.FirstName);
            Assert.Equal("Doe", user.LastName);
            Assert.Equal("john@test.com", user.Email);
            Assert.Equal("hashed", user.PasswordHash);
            Assert.Equal(UserRole.Admin, user.Role);
            Assert.Equal("GOV123", user.GovernmentId);
            Assert.Equal("123 Main St", user.Address);
            Assert.Equal("1234567890", user.Phone);
            Assert.Equal(new DateTime(1990, 1, 1), user.DateOfBirth);
            Assert.True(user.IsDeleted);
        }
    }
}
