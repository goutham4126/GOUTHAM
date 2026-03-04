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

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReviewedAt { get; set; }

        // Navigation properties
        public User User { get; set; } = null!;
        public Plan Plan { get; set; } = null!;
        public User? Agent { get; set; }
    }
}
