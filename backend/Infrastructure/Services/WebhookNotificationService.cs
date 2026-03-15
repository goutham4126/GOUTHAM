using Application.Interfaces;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Infrastructure.Services
{
    public class WebhookNotificationService : IWebhookNotificationService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<WebhookNotificationService> _logger;
        private const string WebhookUrl = "https://goutham4126.app.n8n.cloud/webhook/send-policy-email";

        public WebhookNotificationService(HttpClient httpClient, ILogger<WebhookNotificationService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task SendPolicyPurchaseEmailAsync(string email, string name, string policyName, string invoiceUrl)
        {
            try
            {
                var payload = new
                {
                    email = email,
                    name = name,
                    policyName = policyName,
                    invoiceUrl = invoiceUrl
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json"
                );

                // We don't want a failed webhook to crash the calling process if awaited normally
                // (though the caller might implement fire-and-forget). It's inherently safe here if exceptions are caught.
                var response = await _httpClient.PostAsync(WebhookUrl, content);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Webhook call for policy purchase email failed with status {StatusCode} for User {Email}", response.StatusCode, email);
                }
                else
                {
                    _logger.LogInformation("Webhook policy purchase email sent successfully for User {Email}", email);
                }
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Exception occurred while sending policy purchase email webhook for User {Email}", email);
            }
        }
    }
}
