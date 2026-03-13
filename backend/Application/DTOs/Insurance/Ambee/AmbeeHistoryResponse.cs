using System.Text.Json.Serialization;

namespace Application.DTOs.Insurance.Ambee;

public class AmbeeHistoryResponse
{
    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("data")]
    public List<AmbeeDisasterData> Data { get; set; } = new();
}

public class AmbeeDisasterData
{
    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;

    [JsonPropertyName("lat")]
    public double Lat { get; set; }

    [JsonPropertyName("lng")]
    public double Lng { get; set; }

    [JsonPropertyName("continent")]
    public string Continent { get; set; } = string.Empty;

    [JsonPropertyName("created_time")]
    public string CreatedTime { get; set; } = string.Empty;

    [JsonPropertyName("event_id")]
    public string EventId { get; set; } = string.Empty;

    [JsonPropertyName("estimated_end_date")]
    public string EstimatedEndDate { get; set; } = string.Empty;

    [JsonPropertyName("event_type")]
    public string EventType { get; set; } = string.Empty;
}
