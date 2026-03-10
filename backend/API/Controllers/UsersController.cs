using Application.DTOs;
using Application.DTOs.Users;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _repository;
    private readonly IAuthService _authService;

    public UsersController(IUserRepository repository, IAuthService authService)
    {
        _repository = repository;
        _authService = authService;
    }

    private Guid GetUserId()
    {
        var id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (id == null)
            throw new UnauthorizedAccessException("Invalid token.");

        return Guid.Parse(id);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var user = await _repository.GetByIdAsync(GetUserId());

        if (user == null)
            throw new KeyNotFoundException("User not found.");

        return Ok(new UserDto(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            user.Role.ToString(),
            user.GovernmentId,
            user.Address,
            user.Phone,
            user.DateOfBirth,
            user.CreatedAt,
            user.ProfileImageUrl
        ));
    }

    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto request)
    {
        var user = await _repository.GetByIdAsync(GetUserId());

        if (user == null)
            return NotFound("User not found.");

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.Phone = request.Phone;
        user.Address = request.Address;
        user.GovernmentId = request.GovernmentId;
        user.DateOfBirth = request.DateOfBirth;
        user.UpdatedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(user);

        return Ok(new UserDto(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            user.Role.ToString(),
            user.GovernmentId,
            user.Address,
            user.Phone,
            user.DateOfBirth,
            user.CreatedAt,
            user.ProfileImageUrl
        ));
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _repository.GetAllAsync();

        return Ok(users.Select(u => new UserDto(
            u.Id,
            u.FirstName,
            u.LastName,
            u.Email,
            u.Role.ToString(),
            u.GovernmentId,
            u.Address,
            u.Phone,
            u.DateOfBirth,
            u.CreatedAt,
            u.ProfileImageUrl
        )));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}/role")]
    public async Task<IActionResult> UpdateRole([FromRoute] Guid id, [FromBody] UpdateRoleDto request)
    {
        var user = await _repository.GetByIdAsync(id);
        if (user == null)
            return NotFound("User not found.");

        user.Role = request.Role;
        await _repository.UpdateAsync(user);

        return Ok("Role updated successfully.");
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteUser([FromRoute] Guid id)
    {
        var user = await _repository.GetByIdAsync(id);
        if (user == null)
            return NotFound("User not found.");

        await _repository.DeleteAsync(id);

        return Ok("User deleted successfully.");
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("register")]
    public async Task<IActionResult> RegisterEmployee([FromBody] RegisterEmployeeDto request)
    {
        var result = await _authService.RegisterEmployeeAsync(request);
        return Ok(result);
    }
}