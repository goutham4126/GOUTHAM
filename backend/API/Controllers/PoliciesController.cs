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
    [HttpPost("purchase/{planId:guid}")]
    public async Task<IActionResult> Purchase(Guid planId)
    {
        var userId = GetUserId();
        var policy = await _policyService.PurchasePolicyAsync(userId, planId);
        return Ok(policy);
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
        var policy = await _policyService.GetPolicyAsync(policyId);
        if (policy == null)
            return NotFound();

        return Ok(policy);
    }

    [Authorize(Roles = "Customer")]
    [HttpPost("pay/{paymentId:guid}")]
    public async Task<IActionResult> Pay(Guid paymentId)
    {
        await _policyService.MarkPaymentAsPaidAsync(paymentId);
        return Ok("Payment marked as paid");
    }

    [Authorize(Roles = "Agent")]
    [HttpGet("assigned")]
    public async Task<IActionResult> MyAssignedPolicies()
    {
        var agentId = Guid.Parse(
            User.FindFirst(ClaimTypes.NameIdentifier)!.Value
        );

        var policies = await _policyService.GetAssignedPoliciesAsync(agentId);

        return Ok(policies);
    }
}