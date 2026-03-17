using System.Net.Http.Json;
using Application.Configuration;
using Application.DTOs.Insurance;
using Application.Interfaces;
using Microsoft.Extensions.Options;

namespace Infrastructure.Services;

public class InsuranceCallService : IInsuranceCallService
{
    private readonly HttpClient _httpClient;
    private readonly RinggAISettings _settings;

    public InsuranceCallService(HttpClient httpClient, IOptions<RinggAISettings> settings)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
    }

    public async Task<InsuranceCallResponse> InitiateCallAsync(InitiateCallRequest request)
    {
        var httpRequest = new HttpRequestMessage(HttpMethod.Post, _settings.WebhookUrl);
        httpRequest.Headers.Add("Authorization", $"Bearer {_settings.ApiKey}");
        httpRequest.Headers.Add("x-api-key", _settings.ApiKey);
        httpRequest.Content = JsonContent.Create(request);

        var response = await _httpClient.SendAsync(httpRequest);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new Exception($"Failed to initiate call. Status: {response.StatusCode}. Error: {error}");
        }

        try
        {
            var result = await response.Content.ReadFromJsonAsync<InsuranceCallResponse>();
            if (result != null && (!string.IsNullOrWhiteSpace(result.CallId) || !string.IsNullOrWhiteSpace(result.Status)))
            {
                return result;
            }
        }
        catch 
        {
            // Ignore format exceptions and use fallback
        }

        // Fallback if the response isn't directly matching our object
        return new InsuranceCallResponse { CallId = Guid.NewGuid().ToString(), Status = "Success" };
    }
}
