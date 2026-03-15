using Microsoft.AspNetCore.Mvc;
using Razorpay.Api;
using Microsoft.Extensions.Configuration;

namespace API.Controllers
{
    [ApiController]
    [Route("api/payments")]
    public class PaymentsController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public PaymentsController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpPost("create-order")]
        public IActionResult CreateOrder([FromBody] CreateOrderRequest request)
        {
            try
            {
                var keyId = _configuration["Razorpay:KeyId"];
                var keySecret = _configuration["Razorpay:KeySecret"];

                RazorpayClient client = new RazorpayClient(keyId, keySecret);

                Dictionary<string, object> options = new Dictionary<string, object>
                {
                    { "amount", (int)(request.Amount * 100) }, // amount in the smallest currency unit (paisa)
                    { "currency", "INR" },
                    { "receipt", "receipt_" + Guid.NewGuid().ToString().Substring(0, 8) }
                };

                Order order = client.Order.Create(options);

                return Ok(new { orderId = order["id"].ToString() });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error creating order: " + ex.Message);
                return StatusCode(500, new { error = "Failed to create order" });
            }
        }
    }

    public class CreateOrderRequest
    {
        public decimal Amount { get; set; }
    }
}
