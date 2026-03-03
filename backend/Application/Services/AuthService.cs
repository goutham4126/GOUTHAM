using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;

namespace Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IPasswordService _passwordService;
        private readonly IJwtService _jwtService;

        public AuthService(
            IUserRepository userRepository,
            IPasswordService passwordService,
            IJwtService jwtService)
        {
            _userRepository = userRepository;
            _passwordService = passwordService;
            _jwtService = jwtService;
        }

        public async Task<AuthResultDto> RegisterAsync(RegisterDto request)
        {
            var email = request.Email.Trim().ToLower();

            if (await _userRepository.EmailExistsAsync(email))
                throw new InvalidOperationException("Email already registered.");

            var user = new User
            {
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                Email = email,
                PasswordHash = _passwordService.HashPassword(request.Password),
                GovernmentId = request.GovernmentId,
                Address = request.Address,
                Phone = request.Phone,
                DateOfBirth = request.DateOfBirth,
                Role = UserRole.Customer
            };

            await _userRepository.AddAsync(user);

            var token = _jwtService.GenerateToken(user);

            return new AuthResultDto(
                user.Id,
                $"{user.FirstName} {user.LastName}",
                user.Email,
                user.Role.ToString(),
                token
            );
        }

        public async Task<AuthResultDto> LoginAsync(LoginDto request)
        {
            var email = request.Email.Trim().ToLower();

            var user = await _userRepository.GetByEmailAsync(email);

            if (user == null || user.IsDeleted)
                throw new UnauthorizedAccessException("Invalid credentials.");

            if (!_passwordService.VerifyPassword(request.Password, user.PasswordHash))
                throw new UnauthorizedAccessException("Invalid credentials.");

            var token = _jwtService.GenerateToken(user);

            return new AuthResultDto(
                user.Id,
                $"{user.FirstName} {user.LastName}",
                user.Email,
                user.Role.ToString(),
                token
            );
        }
    }
}
