using Domain.Entities;
using Domain.Enums;

namespace Domain.Tests.Entities
{
    public class ClaimTests
    {
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
    }
}
