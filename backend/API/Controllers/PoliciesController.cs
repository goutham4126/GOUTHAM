using Application.Interfaces;
using Application.DTOs.Insurance;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/policies")]
public class PoliciesController : ControllerBase
{
    private readonly IPolicyService _policyService;

    public PoliciesController(IPolicyService policyService)
    {
        _policyService = policyService;
    }

    private Guid GetUserId()
    {
        var id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (id == null)
            throw new UnauthorizedAccessException("Invalid token.");

        return Guid.Parse(id);
    }

    [Authorize(Roles = "Customer")]
    [HttpPost("purchase")]
    public async Task<IActionResult> Purchase([FromBody] PurchasePolicyRequest request)
    {
        var userId = GetUserId();
        var durationInMonths = request.DurationInYears * 12;
        var policyDto = await _policyService.PurchasePolicyAsync(userId, request.PlanId, durationInMonths, request.PaymentFrequency);
        return Ok(policyDto);
    }

    [Authorize(Roles = "Customer")]
    [HttpGet("my")]
    public async Task<IActionResult> MyPolicies()
    {
        var userId = GetUserId();
        var policies = await _policyService.GetUserPoliciesAsync(userId);
        return Ok(policies);
    }

    [Authorize]
    [HttpGet("{policyId:guid}")]
    public async Task<IActionResult> GetPolicy(Guid policyId)
    {
        var userId = GetUserId();
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "Customer";

        var policy = await _policyService.GetPolicyAsync(policyId, userId, userRole);
        if (policy == null)
            return NotFound();

        return Ok(policy);
    }

    [Authorize(Roles = "Customer")]
    [HttpPost("pay/{paymentId:guid}")]
    public async Task<IActionResult> Pay(Guid paymentId)
    {
        var userId = GetUserId();
        await _policyService.MarkPaymentAsPaidAsync(paymentId, userId);
        return Ok("Payment marked as paid");
    }

    [Authorize(Roles = "Agent")]
    [HttpGet("assigned")]
    public async Task<IActionResult> MyAssignedPolicies()
    {
        var agentId = GetUserId();

        var policies = await _policyService.GetAssignedPoliciesAsync(agentId);

        return Ok(policies);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("all")]
    public async Task<IActionResult> GetAllPolicies()
    {
        var policies = await _policyService.GetAllPoliciesAsync();
        return Ok(policies);
    }
}