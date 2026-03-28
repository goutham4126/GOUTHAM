using Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace Domain.Entities
{
    public class User
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required, StringLength(100)]
        public string FirstName { get; set; } = null!;

        [Required, StringLength(100)]
        public string LastName { get; set; } = null!;

        [Required, EmailAddress, StringLength(255)]
        public string Email { get; set; } = null!;

        [Required]
        public string PasswordHash { get; set; } = null!;

        [Required]
        public UserRole Role { get; set; } = UserRole.Customer;

        public string? GovernmentId { get; set; }
        public string? Address { get; set; }
        public string? Phone { get; set; }
        public DateTime? DateOfBirth { get; set; }

        [StringLength(50)]
        public string? BankAccountNumber { get; set; }

        [StringLength(20)]
        public string? IFSCCode { get; set; }
        public bool IsIfscVerified { get; set; } = false;
        public bool IsBankAccountVerified { get; set; } = false;
        public bool IsDeleted { get; set; } = false;

        public string? ProfileImageUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<Policy> Policies { get; set; } = new List<Policy>();
        public ICollection<Claim> Claims { get; set; } = new List<Claim>();
        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    }
}