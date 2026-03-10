
namespace Application.DTOs;
    public record RegisterDto(
        string FirstName,
        string LastName,
        string Email,
        string Password,
        string? GovernmentId,
        string? Address,
        string? Phone,
        DateTime? DateOfBirth,
        string? ProfileImageBase64 = null
    );

    public record LoginDto(
        string Email,
        string Password
    );

    public record AuthResultDto(
        Guid UserId,
        string FullName,
        string Email,
        string Role,
        string Token
    );

    public record RegisterEmployeeDto(
        string FirstName,
        string LastName,
        string Email,
        string Password,
        string Role,
        string? GovernmentId,
        string? Address,
        string? Phone,
        DateTime? DateOfBirth
    );