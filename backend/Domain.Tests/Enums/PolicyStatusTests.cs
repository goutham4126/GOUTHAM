using Domain.Enums;

namespace Domain.Tests.Enums
{
    public class PolicyStatusTests
    {
        [Fact]
        public void PolicyStatus_HasExpectedValues()
        {
            Assert.Equal(0, (int)PolicyStatus.Active);
            Assert.Equal(1, (int)PolicyStatus.Completed);
            Assert.Equal(2, (int)PolicyStatus.Cancelled);
            Assert.Equal(3, (int)PolicyStatus.Suspended);
            Assert.Equal(4, Enum.GetValues<PolicyStatus>().Length);
        }
    }
}
