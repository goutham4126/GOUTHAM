using System.ComponentModel.DataAnnotations;

namespace Domain.Entities
{
    public class ClaimPayment
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ClaimId { get; set; }

        public decimal AmountPaid { get; set; }

        public DateTime PaidAt { get; set; } = DateTime.UtcNow;

        public Claim Claim { get; set; } = null!;
    }
}