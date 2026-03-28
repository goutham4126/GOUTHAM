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
        private readonly IVercelBlobService _blobService;

        public AuthService(
            IUserRepository userRepository,
            IPasswordService passwordService,
            IJwtService jwtService,
            IVercelBlobService blobService)
        {
            _userRepository = userRepository;
            _passwordService = passwordService;
            _jwtService = jwtService;
            _blobService = blobService;
        }

        public async Task<AuthResultDto> RegisterAsync(RegisterDto request)
        {
            var email = request.Email.Trim().ToLower();

            if (await _userRepository.EmailExistsAsync(email))
                throw new InvalidOperationException("Email already registered.");

            string? profileImageUrl = null;
            if (!string.IsNullOrWhiteSpace(request.ProfileImageBase64))
            {
                var base64Data = request.ProfileImageBase64;
                if (base64Data.Contains(","))
                {
                    base64Data = base64Data.Substring(base64Data.IndexOf(",") + 1);
                }
                var bytes = Convert.FromBase64String(base64Data);
                var fileName = $"profile_{Guid.NewGuid()}.jpg";
                profileImageUrl = await _blobService.UploadFileAsync(bytes, fileName, "profiles", "image/jpeg");
            }

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
                BankAccountNumber = request.BankAccountNumber,
                IFSCCode = request.IFSCCode,
                IsIfscVerified = request.IsIfscVerified,
                IsBankAccountVerified = request.IsBankAccountVerified,
                Role = UserRole.Customer,
                ProfileImageUrl = profileImageUrl
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

        public async Task<AuthResultDto> RegisterEmployeeAsync(RegisterEmployeeDto request)
        {
            var email = request.Email.Trim().ToLower();

            if (await _userRepository.EmailExistsAsync(email))
                throw new InvalidOperationException("Email already registered.");

            if (!Enum.TryParse<UserRole>(request.Role, true, out var role) || 
                (role != UserRole.Agent && role != UserRole.ClaimOfficer))
            {
                throw new ArgumentException("Invalid role specified. Only Agent or ClaimOfficer allowed.");
            }

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
                BankAccountNumber = request.BankAccountNumber,
                IFSCCode = request.IFSCCode,
                Role = role
            };

            await _userRepository.AddAsync(user);

            // Return a null Token or don't generate token for an admin registering others.
            // But we need to match AuthResultDto signature. Returning empty string for Token
            return new AuthResultDto(
                user.Id,
                $"{user.FirstName} {user.LastName}",
                user.Email,
                user.Role.ToString(),
                string.Empty
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
