using Domain.Entities;
using Domain.Enums;

namespace Domain.Tests
{
    public class EntityTests
    {
        // ── User ──

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

        // ── Plan ──

        [Fact]
        public void Plan_DefaultValues_AreCorrect()
        {
            var plan = new Plan();

            Assert.NotEqual(Guid.Empty, plan.Id);
            Assert.True(plan.IsActive);
            Assert.Empty(plan.Policies);
        }

        [Fact]
        public void Plan_SetProperties_RetainsValues()
        {
            var plan = new Plan
            {
                Name = "Gold Plan",
                Description = "Premium coverage",
                PremiumAmount = 100m,
                CoverageAmount = 50000m,
                DurationInMonths = 12,
                PaymentFrequency = "Monthly",
                PlanType = "Health"
            };

            Assert.Equal("Gold Plan", plan.Name);
            Assert.Equal("Premium coverage", plan.Description);
            Assert.Equal(100m, plan.PremiumAmount);
            Assert.Equal(50000m, plan.CoverageAmount);
            Assert.Equal(12, plan.DurationInMonths);
            Assert.Equal("Monthly", plan.PaymentFrequency);
            Assert.Equal("Health", plan.PlanType);
        }

        // ── Policy ──

        [Fact]
        public void Policy_DefaultValues_AreCorrect()
        {
            var policy = new Policy();

            Assert.NotEqual(Guid.Empty, policy.Id);
            Assert.Equal(PolicyStatus.Active, policy.Status);
            Assert.Empty(policy.Payments);
            Assert.Empty(policy.Claims);
        }

        [Fact]
        public void Policy_SetProperties_RetainsValues()
        {
            var userId = Guid.NewGuid();
            var planId = Guid.NewGuid();
            var agentId = Guid.NewGuid();

            var policy = new Policy
            {
                UserId = userId,
                PlanId = planId,
                AgentId = agentId,
                DurationInMonths = 24,
                PaymentFrequency = PaymentFrequency.Monthly,
                TotalPremium = 2400m,
                TotalPaid = 200m,
                PlanBaseCoverageAmount = 50000m,
                PlanBasePremiumAmount = 100m,
                CoverageAmount = 100000m,
                Status = PolicyStatus.Completed
            };

            Assert.Equal(userId, policy.UserId);
            Assert.Equal(planId, policy.PlanId);
            Assert.Equal(agentId, policy.AgentId);
            Assert.Equal(24, policy.DurationInMonths);
            Assert.Equal(PaymentFrequency.Monthly, policy.PaymentFrequency);
            Assert.Equal(2400m, policy.TotalPremium);
            Assert.Equal(200m, policy.TotalPaid);
            Assert.Equal(50000m, policy.PlanBaseCoverageAmount);
            Assert.Equal(100m, policy.PlanBasePremiumAmount);
            Assert.Equal(100000m, policy.CoverageAmount);
            Assert.Equal(PolicyStatus.Completed, policy.Status);
        }

        // ── Claim ──

        [Fact]
        public void Claim_DefaultValues_AreCorrect()
        {
            var claim = new Claim();

            Assert.NotEqual(Guid.Empty, claim.Id);
            Assert.Equal(ClaimStatus.Pending, claim.Status);
            Assert.Null(claim.ApprovedAmount);
            Assert.Null(claim.ProcessedAt);
        }

        [Fact]
        public void Claim_SetProperties_RetainsValues()
        {
            var claim = new Claim
            {
                PolicyId = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                Reason = "Accident",
                ClaimAmount = 5000m,
                ApprovedAmount = 4000m,
                Status = ClaimStatus.Approved,
                DocumentUrl = "https://example.com/doc.pdf",
                DocumentHash = "abc123hash"
            };

            Assert.Equal("Accident", claim.Reason);
            Assert.Equal(5000m, claim.ClaimAmount);
            Assert.Equal(4000m, claim.ApprovedAmount);
            Assert.Equal(ClaimStatus.Approved, claim.Status);
            Assert.Equal("https://example.com/doc.pdf", claim.DocumentUrl);
            Assert.Equal("abc123hash", claim.DocumentHash);
        }

        // ── Invoice ──

        [Fact]
        public void Invoice_DefaultValues_AreCorrect()
        {
            var invoice = new Invoice();

            Assert.NotEqual(Guid.Empty, invoice.Id);
        }

        [Fact]
        public void Invoice_SetProperties_RetainsValues()
        {
            var userId = Guid.NewGuid();
            var refId = Guid.NewGuid();

            var invoice = new Invoice
            {
                UserId = userId,
                ReferenceId = refId,
                Type = InvoiceType.PolicyPurchase,
                FileUrl = "https://blob.example.com/invoice.pdf"
            };

            Assert.Equal(userId, invoice.UserId);
            Assert.Equal(refId, invoice.ReferenceId);
            Assert.Equal(InvoiceType.PolicyPurchase, invoice.Type);
            Assert.Equal("https://blob.example.com/invoice.pdf", invoice.FileUrl);
        }

        // ── ClaimPayment ──

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

        // ── PolicyPayment ──

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

        // ── Notification ──

        [Fact]
        public void Notification_DefaultValues_AreCorrect()
        {
            var n = new Notification();

            Assert.Equal(string.Empty, n.Title);
            Assert.Equal(string.Empty, n.Message);
            Assert.False(n.IsRead);
        }

        [Fact]
        public void Notification_SetProperties_RetainsValues()
        {
            var userId = Guid.NewGuid();
            var n = new Notification
            {
                UserId = userId,
                Title = "Claim Approved",
                Message = "Your claim has been approved.",
                IsRead = true
            };

            Assert.Equal(userId, n.UserId);
            Assert.Equal("Claim Approved", n.Title);
            Assert.Equal("Your claim has been approved.", n.Message);
            Assert.True(n.IsRead);
        }
    }
}
