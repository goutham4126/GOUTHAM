using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Domain.Entities
{
    public class Plan
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required, StringLength(200)]
        public string Name { get; set; } = null!;

        [Required]
        public string Description { get; set; } = null!;

        [Required]
        public decimal PremiumAmount { get; set; }

        [Required]
        public decimal CoverageAmount { get; set; }

        [Required]
        public int DurationInMonths { get; set; }

        [Required]
        public string PaymentFrequency { get; set; } = null!;

        [Required]
        public string PlanType { get; set; } = null!;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Policy> Policies { get; set; } = new List<Policy>();
    }
}