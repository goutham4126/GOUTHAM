using Application.Interfaces;
using Application.DTOs.Insurance;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers
{
    [ApiController]
    [Route("api/policy-requests")]
    public class PolicyRequestsController : ControllerBase
    {
        private readonly IPolicyRequestService _policyRequestService;

        public PolicyRequestsController(IPolicyRequestService policyRequestService)
        {
            _policyRequestService = policyRequestService;
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
        public async Task<IActionResult> Create([FromForm] CreatePolicyRequestPayload payload)
        {
            var userId = GetUserId();

            if (payload.PanDocument == null || payload.AddressDocument == null)
                return BadRequest("Documents are required.");

            using var panSpan = new MemoryStream();
            await payload.PanDocument.CopyToAsync(panSpan);

            using var addressSpan = new MemoryStream();
            await payload.AddressDocument.CopyToAsync(addressSpan);

            var result = await _policyRequestService.CreatePolicyRequestAsync(
                userId,
                payload.PlanId,
                payload.DurationInMonths,
                payload.PaymentFrequency,
                panSpan.ToArray(),
                payload.PanDocument.FileName,
                addressSpan.ToArray(),
                payload.AddressDocument.FileName,
                payload.KycDetailsJson
            );

            return Ok(result);
        }

        [Authorize(Roles = "Customer")]
        [HttpGet("my")]
        public async Task<IActionResult> MyRequests()
        {
            var userId = GetUserId();
            var requests = await _policyRequestService.GetUserRequestsAsync(userId);
            return Ok(requests);
        }

        [Authorize(Roles = "Agent")]
        [HttpGet("assigned")]
        public async Task<IActionResult> AssignedRequests()
        {
            var agentId = GetUserId();
            var requests = await _policyRequestService.GetAgentRequestsAsync(agentId);
            return Ok(requests);
        }

        [Authorize(Roles = "Agent")]
        [HttpPost("{id:guid}/approve")]
        public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveRequestPayload payload)
        {
            var agentId = GetUserId();
            var result = await _policyRequestService.ApproveRequestAsync(id, agentId, payload.Remarks);
            return Ok(result);
        }

        [Authorize(Roles = "Agent")]
        [HttpPost("{id:guid}/reject")]
        public async Task<IActionResult> Reject(Guid id, [FromBody] RejectRequestPayload payload)
        {
            var agentId = GetUserId();
            var result = await _policyRequestService.RejectRequestAsync(id, agentId, payload.Reason, payload.Remarks);
            return Ok(result);
        }
    }

    public class CreatePolicyRequestPayload
    {
        public Guid PlanId { get; set; }
        public int DurationInMonths { get; set; }
        public PaymentFrequency PaymentFrequency { get; set; }
        public IFormFile PanDocument { get; set; } = null!;
        public IFormFile AddressDocument { get; set; } = null!;
        public string KycDetailsJson { get; set; } = null!;
    }

    public class RejectRequestPayload
    {
        public string Reason { get; set; } = null!;
        public string? Remarks { get; set; }
    }

    public class ApproveRequestPayload
    {
        public string? Remarks { get; set; }
    }
}
