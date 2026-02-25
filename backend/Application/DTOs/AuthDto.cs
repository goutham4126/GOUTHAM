
namespace Application.DTOs;
    public record RegisterDto(
        string FirstName,
        string LastName,
        string Email,
        string Password,
        string? GovernmentId,
        string? Address,
        string? Phone,
        DateTime? DateOfBirth
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