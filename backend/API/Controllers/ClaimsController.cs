using Application.DTOs.Insurance;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/claims")]
public class ClaimsController : ControllerBase
{
    private readonly IClaimService _claimService;

    public ClaimsController(IClaimService claimService)
    {
        _claimService = claimService;
    }

    private Guid GetUserId()
    {
        var id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (id == null)
            throw new UnauthorizedAccessException("Invalid token.");

        return Guid.Parse(id);
    }

    [Authorize(Roles = "Customer")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateClaimRequest request)
    {
        var userId = GetUserId();

        var claim = await _claimService.CreateClaimAsync(
            userId,
            request.PolicyId,
            request.Reason,
            request.Amount,
            request.DocumentUrl,
            request.DocumentHash
        );

        return Ok(claim);
    }

    [Authorize(Roles = "Customer")]
    [HttpGet("my")]
    public async Task<IActionResult> MyClaims()
    {
        var userId = GetUserId();
        var claims = await _claimService.GetUserClaimsAsync(userId);
        return Ok(claims);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var claims = await _claimService.GetAllClaimsAsync();
        return Ok(claims);
    }

    [Authorize(Roles = "ClaimOfficer")]
    [HttpPost("{claimId:guid}/approve")]
    public async Task<IActionResult> Approve([FromRoute] Guid claimId, [FromBody] ApproveClaimRequest request)
    {
        var officerId = GetUserId();
        await _claimService.ApproveClaimAsync(claimId, request.ApprovedAmount, officerId, request.Remarks);
        return Ok("Claim approved and payout processed");
    }

    [Authorize(Roles = "ClaimOfficer")]
    [HttpPost("{claimId:guid}/reject")]
    public async Task<IActionResult> Reject([FromRoute] Guid claimId, [FromBody] RejectClaimRequest request)
    {
        var officerId = GetUserId();
        await _claimService.RejectClaimAsync(claimId, officerId, request.Remarks);
        return Ok("Claim rejected");
    }

    [Authorize(Roles = "ClaimOfficer")]
    [HttpGet("assigned")]
    public async Task<IActionResult> MyAssignedClaims()
    {
        var officerId = GetUserId();

        var claims = await _claimService.GetAssignedClaimsAsync(officerId);

        return Ok(claims);
    }
}