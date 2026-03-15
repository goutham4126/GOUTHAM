using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities
{
    public class KycDetails
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public string PanNumber { get; set; } = null!;
        public string? PanName { get; set; }
        public string? PanDob { get; set; }

        public string AadhaarReferenceId { get; set; } = null!;
        public string? AadhaarName { get; set; }
        public string? AadhaarGender { get; set; }
        public string? AadhaarDob { get; set; }
        public string? AadhaarAddress { get; set; }
        
        /// <summary>Base64 encoded photo from Aadhaar verification</summary>
        public string? AadhaarPhotoBase64 { get; set; }

        public DateTime VerifiedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User User { get; set; } = null!;

        [InverseProperty("KycDetails")]
        public ICollection<PolicyRequest> PolicyRequests { get; set; } = new List<PolicyRequest>();
    }
}
