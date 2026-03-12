using System.Net.Http.Json;
using Application.DTOs.Insurance;
using Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace Application.Services
{
    public class AiDocumentService : IAiDocumentService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<AiDocumentService> _logger;

        public AiDocumentService(HttpClient httpClient, ILogger<AiDocumentService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<PolicyAiDocumentResponseDto?> GenerateDocumentSectionsAsync(PolicyAiDocumentRequestDto request)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("https://goutham4126.app.n8n.cloud/webhook/policy-document-ai", request);
                
                if (response.IsSuccessStatusCode)
                {
                    return await response.Content.ReadFromJsonAsync<PolicyAiDocumentResponseDto>();
                }
                
                _logger.LogWarning("AI Webhook returned non-success status code: {StatusCode}", response.StatusCode);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to call AI Document Webhook");
                return null;
            }
        }
    }
}
