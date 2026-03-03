using Domain.Enums;

namespace Domain.Tests.Enums
{
    public class PaymentFrequencyTests
    {
        [Fact]
        public void PaymentFrequency_HasExpectedValues()
        {
            Assert.Equal(0, (int)PaymentFrequency.Monthly);
            Assert.Equal(1, (int)PaymentFrequency.Quarterly);
            Assert.Equal(2, (int)PaymentFrequency.Yearly);
            Assert.Equal(3, Enum.GetValues<PaymentFrequency>().Length);
        }
    }
}
