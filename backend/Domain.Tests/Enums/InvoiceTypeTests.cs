using Domain.Enums;

namespace Domain.Tests.Enums
{
    public class InvoiceTypeTests
    {
        [Fact]
        public void InvoiceType_HasExpectedValues()
        {
            Assert.Equal(0, (int)InvoiceType.PolicyPurchase);
            Assert.Equal(1, (int)InvoiceType.ClaimStatus);
            Assert.Equal(2, (int)InvoiceType.Payment);
            Assert.Equal(3, Enum.GetValues<InvoiceType>().Length);
        }
    }
}
