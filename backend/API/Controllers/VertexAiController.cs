using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/vertex-ai")]
    [Authorize(Roles = "ClaimOfficer,Admin")]
    public class VertexAiController : ControllerBase
    {
        private readonly IVertexAiService _vertexAiService;

        public VertexAiController(IVertexAiService vertexAiService)
        {
            _vertexAiService = vertexAiService;
        }

        [HttpGet("claims/{claimId:guid}/summary")]
        public async Task<IActionResult> GetClaimSummary(Guid claimId)
        {
            var summary = await _vertexAiService.SummarizeClaimAsync(claimId);
            return Ok(new { summary });
        }
    }
}
