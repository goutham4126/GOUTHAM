using Domain.Entities;
using Domain.Enums;

namespace Domain.Tests.Entities
{
    public class PolicyTests
    {
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
    }
}
