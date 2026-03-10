using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domain.Enums;

namespace Domain.Entities
{
    public class Claim
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid PolicyId { get; set; }

        [Required]
        public Guid UserId { get; set; }   // Customer

        public Guid? ClaimOfficerId { get; set; } // Assigned clams officer

        [ForeignKey(nameof(ClaimOfficerId))]
        public User? ClaimOfficer { get; set; }

        [Required]
        [StringLength(1000)]
        public string Reason { get; set; } = null!;


        [StringLength(1000)]
        public string? DocumentUrl { get; set; }

        [StringLength(256)]
        public string? DocumentHash { get; set; }  // SHA256

        [Required]
        [Range(0, double.MaxValue)]
        public decimal ClaimAmount { get; set; }

        public decimal? ApprovedAmount { get; set; }

        public ClaimStatus Status { get; set; } = ClaimStatus.Pending;

        [StringLength(1000)]
        public string? Remarks { get; set; }

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessedAt { get; set; }

        public DateTime? ScheduledVideoCallDate { get; set; }

        public VideoVerificationStatus VideoVerificationStatus { get; set; } = VideoVerificationStatus.NotStarted;

        [StringLength(1000)]
        public string? VideoVerificationRemarks { get; set; }

        public Policy Policy { get; set; } = null!;
        public User User { get; set; } = null!;
        public ClaimPayment? ClaimPayment { get; set; }
    }
}