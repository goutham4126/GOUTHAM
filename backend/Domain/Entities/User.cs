using Domain.Enums;

namespace Domain.Entities
{
    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;

        public UserRole Role { get; set; } = UserRole.Customer;

        // Insurance Specific
        public string? GovernmentId { get; set; }
        public string? Address { get; set; }
        public string? Phone { get; set; }
        public DateTime? DateOfBirth { get; set; }

        // Account Management
        public bool IsDeleted { get; set; } = false;

        // Password Reset
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiry { get; set; }

        // Audit Fields
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

    }
}
