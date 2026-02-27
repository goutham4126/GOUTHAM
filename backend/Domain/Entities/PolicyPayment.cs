using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Domain.Entities
{
    public class PolicyPayment
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid PolicyId { get; set; }

        [Required]
        public decimal Amount { get; set; }

        public DateTime DueDate { get; set; }

        public DateTime? PaidDate { get; set; }

        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

        public Policy Policy { get; set; } = null!;
    }
}