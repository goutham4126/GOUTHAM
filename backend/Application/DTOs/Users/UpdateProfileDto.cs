namespace Application.DTOs.Users;

public record UpdateProfileDto(
    string FirstName,
    string LastName,
    string? Phone,
    string? Address,
    string? GovernmentId,
    DateTime? DateOfBirth,
    string? BankAccountNumber = null,
    string? IFSCCode = null,
    bool IsIfscVerified = false,
    bool IsBankAccountVerified = false,
    string? ProfileImageBase64 = null
);
