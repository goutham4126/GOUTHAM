using Domain.Entities;
using Domain.Enums;

namespace Domain.Tests.Entities
{
    public class PolicyPaymentTests
    {
        [Fact]
        public void PolicyPayment_DefaultValues_AreCorrect()
        {
            var pp = new PolicyPayment();

            Assert.NotEqual(Guid.Empty, pp.Id);
            Assert.Equal(PaymentStatus.Pending, pp.Status);
            Assert.Null(pp.PaidDate);
        }

        [Fact]
        public void PolicyPayment_SetProperties_RetainsValues()
        {
            var policyId = Guid.NewGuid();
            var pp = new PolicyPayment
            {
                PolicyId = policyId,
                Amount = 200m,
                DueDate = new DateTime(2026, 4, 1),
                PaidDate = new DateTime(2026, 3, 28),
                Status = PaymentStatus.Paid
            };

            Assert.Equal(policyId, pp.PolicyId);
            Assert.Equal(200m, pp.Amount);
            Assert.Equal(new DateTime(2026, 4, 1), pp.DueDate);
            Assert.Equal(new DateTime(2026, 3, 28), pp.PaidDate);
            Assert.Equal(PaymentStatus.Paid, pp.Status);
        }
    }
}
