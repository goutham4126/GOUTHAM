using Domain.Enums;

namespace Domain.Tests.Enums
{
    public class PaymentStatusTests
    {
        [Fact]
        public void PaymentStatus_HasExpectedValues()
        {
            Assert.Equal(0, (int)PaymentStatus.Pending);
            Assert.Equal(1, (int)PaymentStatus.Paid);
            Assert.Equal(2, (int)PaymentStatus.Failed);
            Assert.Equal(3, (int)PaymentStatus.Overdue);
            Assert.Equal(4, Enum.GetValues<PaymentStatus>().Length);
        }
    }
}
