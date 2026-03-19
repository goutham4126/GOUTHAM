using System;

namespace Application.DTOs.Insurance
{
    public class ClaimTrackingStageDto
    {
        public Guid Id { get; set; }
        public Guid ClaimId { get; set; }
        public string StageName { get; set; } = null!;
        public string? Remarks { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
