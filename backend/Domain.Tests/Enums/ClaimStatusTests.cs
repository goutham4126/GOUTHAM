using Domain.Enums;

namespace Domain.Tests.Enums
{
    public class ClaimStatusTests
    {
        [Fact]
        public void ClaimStatus_HasExpectedValues()
        {
            Assert.Equal(0, (int)ClaimStatus.Pending);
            Assert.Equal(1, (int)ClaimStatus.Approved);
            Assert.Equal(2, (int)ClaimStatus.Rejected);
            Assert.Equal(3, (int)ClaimStatus.Paid);
            Assert.Equal(4, Enum.GetValues<ClaimStatus>().Length);
        }
    }
}
