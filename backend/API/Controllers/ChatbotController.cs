using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace API.Controllers
{
    [AllowAnonymous]
    [ApiController]
    [Route("api/chatbot")]
    public class ChatbotController : ControllerBase
    {
        private readonly IChatbotService _chatbotService;

        public ChatbotController(IChatbotService chatbotService)
        {
            _chatbotService = chatbotService;
        }

        [HttpPost("chat")]
        public async Task<IActionResult> GetChatResponse([FromBody] ChatRequest request)
        {
            if (string.IsNullOrEmpty(request.Message))
            {
                return BadRequest("Message cannot be empty.");
            }

            var response = await _chatbotService.GetChatResponseAsync(request.Message, request.PlanId);
            return Ok(new { response });
        }

        [AllowAnonymous]
        [HttpGet("bot-plans")]
        public async Task<IActionResult> GetPlans()
        {
            try
            {
                var plans = await _chatbotService.GetAvailablePlansAsync();
                var planDtos = plans.Select(p => new {
                    id = p.Id,
                    name = p.Name,
                    description = p.Description,
                    benefits = p.Benefits,
                    premiumAmount = p.PremiumAmount
                }).ToList();
                return Ok(planDtos);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }

    public class ChatRequest
    {
        public string Message { get; set; } = string.Empty;
        public string? PlanId { get; set; }
    }
}
