using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Insurance
{
    public class AddClaimTrackingRequest
    {
        [Required]
        [StringLength(200)]
        public string StageName { get; set; } = null!;

        [StringLength(1000)]
        public string? Remarks { get; set; }
    }
}
