using Domain.Entities;
using Domain.Enums;

namespace Domain.Tests.Entities
{
    public class InvoiceTests
    {
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
    }
}
