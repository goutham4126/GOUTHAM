using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AgoraIO.Rtc;

namespace API.Controllers;

[ApiController]
[Route("api/agora")]
[Authorize]
public class AgoraController : ControllerBase
{
    private readonly IConfiguration _config;

    public AgoraController(IConfiguration config)
    {
        _config = config;
    }

    [HttpGet("token")]
    public IActionResult GetToken([FromQuery] string channelName)
    {
        if (string.IsNullOrWhiteSpace(channelName))
            return BadRequest("Channel name is required");

        var appId = _config["Agora:AppId"] ?? "7459df6f48f7459aaf93b64ae0c6a73f";
        var appCertificate = _config["Agora:AppCertificate"] ?? "45ae5fabf4354c1eace57e975ec68f29";

        // Use uid 0 for wildcard (any user can use this token)
        uint privilegeExpiredTs = (uint)(DateTimeOffset.UtcNow.ToUnixTimeSeconds() + 3600);
        var builder = new RtcTokenBuilder();
        string token = builder.BuildToken(
            appId,
            appCertificate,
            channelName,
            true, // is publisher
            privilegeExpiredTs
        );

        return Ok(new { token, channelName, appId });
    }
}
