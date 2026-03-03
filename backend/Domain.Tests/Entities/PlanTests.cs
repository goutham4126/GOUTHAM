using Domain.Entities;

namespace Domain.Tests.Entities
{
    public class PlanTests
    {
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
    }
}
