using Domain.Enums;

namespace Application.DTOs.Users;

public record UserDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string Role,
    string? GovernmentId,
    string? Address,
    string? Phone,
    DateTime? DateOfBirth,
    string? BankAccountNumber,
    string? IFSCCode,
    bool IsIfscVerified,
    bool IsBankAccountVerified,
    DateTime CreatedAt,
    string? ProfileImageUrl,
    bool IsDeleted = false
);
