using Domain.Entities;

namespace Domain.Tests.Entities
{
    public class NotificationTests
    {
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
