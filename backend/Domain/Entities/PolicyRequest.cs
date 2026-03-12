using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Domain.Entities
{
    public class PolicyRequest
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public Guid PlanId { get; set; }

        public Guid? AgentId { get; set; }

        [Required]
        public int DurationInMonths { get; set; }

        [Required]
        public PaymentFrequency PaymentFrequency { get; set; }

        [Required]
        public decimal RiskScore { get; set; }

        /// <summary>Snapshot of plan's base monthly premium at request time.</summary>
        [Required]
        public decimal BasePremiumAmount { get; set; }

        /// <summary>Computed coverage for the chosen duration.</summary>
        [Required]
        public decimal CoverageAmount { get; set; }

        /// <summary>Risk-adjusted premium per installment period.</summary>
        [Required]
        public decimal FinalPremiumAmount { get; set; }

        /// <summary>Snapshot of plan type (Disaster / Casualty).</summary>
        [Required]
        public string PlanType { get; set; } = null!;

        /// <summary>Snapshot of plan description.</summary>
        [Required]
        public string PlanDescription { get; set; } = null!;

        [Required]
        public string PanDocumentUrl { get; set; } = null!;

        [Required]
        public string PanDocumentHash { get; set; } = null!;

        [Required]
        public string AddressProofUrl { get; set; } = null!;

        [Required]
        public string AddressProofHash { get; set; } = null!;

        public PolicyRequestStatus Status { get; set; } = PolicyRequestStatus.Pending;

        public string? RejectionReason { get; set; }

        [StringLength(1000)]
        public string? Remarks { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReviewedAt { get; set; }

        // Navigation properties
        public User User { get; set; } = null!;
        public Plan Plan { get; set; } = null!;
        public User? Agent { get; set; }
    }
}
