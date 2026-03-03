using Domain.Enums;

namespace Domain.Tests
{
    public class EnumTests
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

        [Fact]
        public void ClaimStatus_HasExpectedValues()
        {
            Assert.Equal(0, (int)ClaimStatus.Pending);
            Assert.Equal(1, (int)ClaimStatus.Approved);
            Assert.Equal(2, (int)ClaimStatus.Rejected);
            Assert.Equal(3, (int)ClaimStatus.Paid);
            Assert.Equal(4, Enum.GetValues<ClaimStatus>().Length);
        }

        [Fact]
        public void PolicyStatus_HasExpectedValues()
        {
            Assert.Equal(0, (int)PolicyStatus.Active);
            Assert.Equal(1, (int)PolicyStatus.Completed);
            Assert.Equal(2, (int)PolicyStatus.Cancelled);
            Assert.Equal(3, (int)PolicyStatus.Suspended);
            Assert.Equal(4, Enum.GetValues<PolicyStatus>().Length);
        }

        [Fact]
        public void PaymentStatus_HasExpectedValues()
        {
            Assert.Equal(0, (int)PaymentStatus.Pending);
            Assert.Equal(1, (int)PaymentStatus.Paid);
            Assert.Equal(2, (int)PaymentStatus.Failed);
            Assert.Equal(3, (int)PaymentStatus.Overdue);
            Assert.Equal(4, Enum.GetValues<PaymentStatus>().Length);
        }

        [Fact]
        public void PaymentFrequency_HasExpectedValues()
        {
            Assert.Equal(0, (int)PaymentFrequency.Monthly);
            Assert.Equal(1, (int)PaymentFrequency.Quarterly);
            Assert.Equal(2, (int)PaymentFrequency.Yearly);
            Assert.Equal(3, Enum.GetValues<PaymentFrequency>().Length);
        }

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
