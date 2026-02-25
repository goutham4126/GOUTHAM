using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;

namespace Infrastructure.Services
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
            if (await _userRepository.EmailExistsAsync(request.Email))
                throw new Exception("Email already exists");

            var hashedPassword = _passwordService.HashPassword(request.Password);

            var user = new User
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                PasswordHash = hashedPassword,
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
            var user = await _userRepository.GetByEmailAsync(request.Email);

            if (user == null ||
                !_passwordService.VerifyPassword(request.Password, user.PasswordHash))
                throw new Exception("Invalid credentials");

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
