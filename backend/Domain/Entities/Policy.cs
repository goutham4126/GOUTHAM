using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domain.Enums;

namespace Domain.Entities
{
    public class Policy
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; } // Customer

        [Required]
        public Guid PlanId { get; set; } // Plan

        public Guid? AgentId { get; set; } // Agent assigned

        [ForeignKey(nameof(AgentId))]
        public User? Agent { get; set; }

        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime EndDate { get; set; }

        [Required]
        public int DurationInMonths { get; set; }

        [Required]
        public PaymentFrequency PaymentFrequency { get; set; }

        [Required]
        public PolicyStatus Status { get; set; } = PolicyStatus.Active;

        [Required]
        [Range(0, double.MaxValue)]
        public decimal TotalPremium { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal TotalPaid { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
        public Plan Plan { get; set; } = null!;
        public ICollection<PolicyPayment> Payments { get; set; } = new List<PolicyPayment>();
        public ICollection<Claim> Claims { get; set; } = new List<Claim>();
    }
}