namespace Application.DTOs.Users;

public record UpdateProfileDto(
    string FirstName,
    string LastName,
    string? Phone,
    string? Address,
    string? GovernmentId,
    DateTime? DateOfBirth
);
