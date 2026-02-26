using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;

    public UsersController(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    [Authorize]
    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userId == null)
            return Unauthorized();

        var user = await _userRepository.GetByIdAsync(Guid.Parse(userId));

        if (user == null)
            return NotFound();

        return Ok(new
        {
            user.Id,
            user.Email,
            user.Role,
            user.FirstName,
            user.LastName,
            user.GovernmentId,
            user.Address,
            user.Phone,
            user.DateOfBirth
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetUserById(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);

        if (user == null)
            return NotFound();

        return Ok(new
        {
            user.Id,
            user.Email,
            user.Role,
            user.FirstName,
            user.LastName,
            user.GovernmentId,
            user.Address,
            user.Phone,
            user.DateOfBirth
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("all")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _userRepository.GetAllAsync();

        return Ok(users.Select(u => new
        {
            u.Id,
            u.Email,
            u.Role,
            u.FirstName,
            u.LastName,
            u.GovernmentId,
            u.Address,
            u.Phone,
            u.DateOfBirth
    }));
    }
}