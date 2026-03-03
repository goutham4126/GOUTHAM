using Domain.Entities;

namespace Domain.Tests.Entities
{
    public class ClaimPaymentTests
    {
        [Fact]
        public void ClaimPayment_DefaultValues_AreCorrect()
        {
            var cp = new ClaimPayment();

            Assert.NotEqual(Guid.Empty, cp.Id);
        }

        [Fact]
        public void ClaimPayment_SetProperties_RetainsValues()
        {
            var claimId = Guid.NewGuid();
            var cp = new ClaimPayment
            {
                ClaimId = claimId,
                AmountPaid = 4000m
            };

            Assert.Equal(claimId, cp.ClaimId);
            Assert.Equal(4000m, cp.AmountPaid);
        }
    }
}
