using Domain.Enums;

namespace Domain.Tests.Enums
{
    public class UserRoleTests
    {
        [Fact]
        public void UserRole_HasExpectedValues()
        {
            Assert.Equal(0, (int)UserRole.Admin);
            Assert.Equal(1, (int)UserRole.Agent);
            Assert.Equal(2, (int)UserRole.Customer);
            Assert.Equal(3, (int)UserRole.ClaimOfficer);
            Assert.Equal(4, Enum.GetValues<UserRole>().Length);
        }
    }
}
