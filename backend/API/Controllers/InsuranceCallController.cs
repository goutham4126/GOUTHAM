using Application.DTOs.Insurance;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace API.Controllers;

[ApiController]
[Route("api/insurance")]
public class InsuranceCallController : ControllerBase
{
    private readonly IInsuranceCallService _callService;
    private readonly IUserRepository _userRepository;
    private readonly IPlanService _planService;

    public InsuranceCallController(
        IInsuranceCallService callService,
        IUserRepository userRepository,
        IPlanService planService)
    {
        _callService = callService;
        _userRepository = userRepository;
        _planService = planService;
    }

    [Authorize]
    [HttpPost("initiate-call")]
    public async Task<IActionResult> InitiateCall()
    {
        try
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            {
                return Unauthorized("Invalid token.");
            }

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            var plans = await _planService.GetAllAsync(includeInactive: false);
            if (plans == null || !plans.Any())
            {
                return BadRequest(new ProblemDetails
                {
                    Status = 400,
                    Title = "Bad Request",
                    Detail = "No insurance plans available."
                });
            }

            // Format phone number
            var phone = user.Phone ?? string.Empty;
            if (!phone.StartsWith("+91"))
            {
                if (phone.Length == 10)
                {
                    phone = "+91" + phone;
                }
                else if (!phone.StartsWith("+"))
                {
                    phone = "+91" + phone;
                }
            }

            var request = new InitiateCallRequest
            {
                PhoneNumber = phone,
                AgentId = "5fa0ebbf-9544-416c-ab3e-bac1ac33086a",
                CustomerName = $"{user.FirstName} {user.LastName}".Trim(),
                Language = "en",
                Plans = plans.Select(p => new CallPlanDto
                {
                    Id = p.Id.ToString(),
                    Name = p.Name,
                    Premium = p.PremiumAmount,
                    Coverage = $"₹{p.CoverageAmount:N0}",
                    Description = p.Description,
                    Benefits = FormatBenefits(p.Benefits)
                }).ToList()
            };

            var callResponse = await _callService.InitiateCallAsync(request);

            return Ok(callResponse);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ProblemDetails
            {
                Status = 500,
                Title = "Internal Server Error",
                Detail = ex.Message
            });
        }
    }
    private string FormatBenefits(string htmlBenefits)
    {
        if (string.IsNullOrWhiteSpace(htmlBenefits)) return string.Empty;
        
        // Replace common list/block closing tags with a comma
        var text = Regex.Replace(htmlBenefits, @"</(li|p|div|h[1-6])>|<br\s*/?>", ",", RegexOptions.IgnoreCase);
        
        // Remove all other HTML tags
        text = Regex.Replace(text, @"<.*?>", string.Empty);
        
        // Decode common HTML entities like &nbsp;
        text = System.Net.WebUtility.HtmlDecode(text);
        
        // Collapse multiple spaces
        text = Regex.Replace(text, @"\s+", " ").Trim();
        
        // Clean up comma formatting (remove stray spaces around commas, ensure single space after)
        text = Regex.Replace(text, @"\s*,\s*", ", ");
        
        // Clean leading and trailing commas
        return text.Trim(',', ' ');
    }
}
