using System.Text.Json.Serialization;

namespace Application.DTOs.Insurance;

public class InitiateCallRequest
{
    [JsonPropertyName("phoneNumber")]
    public string PhoneNumber { get; set; } = string.Empty;

    [JsonPropertyName("agentId")]
    public string AgentId { get; set; } = string.Empty;

    [JsonPropertyName("customerName")]
    public string CustomerName { get; set; } = string.Empty;

    [JsonPropertyName("language")]
    public string Language { get; set; } = "en";

    [JsonPropertyName("plans")]
    public List<CallPlanDto> Plans { get; set; } = new();
}

public class CallPlanDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("premium")]
    public decimal Premium { get; set; }

    [JsonPropertyName("coverage")]
    public string Coverage { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;
}

public class InsuranceCallResponse
{
    [JsonPropertyName("callId")]
    public string CallId { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
}
