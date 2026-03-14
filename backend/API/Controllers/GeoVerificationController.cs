using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/geo-verification")]
public class GeoVerificationController : ControllerBase
{
    private readonly IGeoVerificationService _geoService;

    public GeoVerificationController(IGeoVerificationService geoService)
    {
        _geoService = geoService;
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        var history = await _geoService.GetDisasterHistoryAsync();
        return Ok(history);
    }

    [Authorize(Roles = "ClaimOfficer")]
    [HttpGet("verify/{claimId:guid}")]
    public async Task<IActionResult> VerifyClaim(Guid claimId)
    {
        var result = await _geoService.VerifyClaimAsync(claimId);
        return Ok(result);
    }
}
