using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities
{
    public class ClaimTrackingStage
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid ClaimId { get; set; }

        [ForeignKey(nameof(ClaimId))]
        public Claim Claim { get; set; } = null!;

        [Required]
        [StringLength(200)]
        public string StageName { get; set; } = null!;

        [StringLength(1000)]
        public string? Remarks { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
