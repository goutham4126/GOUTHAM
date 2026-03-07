using Application.DTOs;

namespace Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResultDto> RegisterAsync(RegisterDto request);
        Task<AuthResultDto> RegisterEmployeeAsync(RegisterEmployeeDto request);
        Task<AuthResultDto> LoginAsync(LoginDto request);
    }
}
