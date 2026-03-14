using Application.DTOs.Insurance.Ambee;
using Application.Interfaces;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Infrastructure.Services;

public class GeoVerificationService : IGeoVerificationService
{
    private readonly HttpClient _httpClient;
    private readonly IAppDbContext _context;
    private readonly ILogger<GeoVerificationService> _logger;

    private const string WebhookUrl = "https://goutham4126.app.n8n.cloud/webhook/disasters";

    public GeoVerificationService(
        HttpClient httpClient,
        IAppDbContext context,
        ILogger<GeoVerificationService> logger)
    {
        _httpClient = httpClient;
        _context = context;
        _logger = logger;
    }

    // -------------------------------------------------------
    // PUBLIC METHOD REQUIRED BY INTERFACE
    // -------------------------------------------------------

    public async Task<AmbeeHistoryResponse> GetDisasterHistoryAsync()
    {
        var disasters = await GetDisastersAsync();

        return new AmbeeHistoryResponse
        {
            Message = "success",
            Data = disasters
        };
    }

    // -------------------------------------------------------
    // FETCH DISASTERS FROM WEBHOOK (FIXED)
    // -------------------------------------------------------

    private async Task<List<AmbeeDisasterData>> GetDisastersAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync(WebhookUrl);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Webhook call failed: {StatusCode}", response.StatusCode);
                return new List<AmbeeDisasterData>();
            }

            var content = await response.Content.ReadAsStringAsync();

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            WebhookDisasterResponse? wrapper = null;

            if (root.ValueKind == JsonValueKind.Array)
            {
                wrapper = JsonSerializer
                    .Deserialize<List<WebhookDisasterResponse>>(content, options)?
                    .FirstOrDefault();
            }
            else if (root.ValueKind == JsonValueKind.Object)
            {
                wrapper = JsonSerializer.Deserialize<WebhookDisasterResponse>(content, options);
            }

            var disasters = wrapper?.Disasters ?? new List<AmbeeDisasterData>();

            _logger.LogInformation("Fetched {Count} disasters from webhook", disasters.Count);

            return disasters;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching disasters from webhook");
            return new List<AmbeeDisasterData>();
        }
    }

    // -------------------------------------------------------
    // CLAIM VERIFICATION LOGIC
    // -------------------------------------------------------

    public async Task<VerificationResultDto> VerifyClaimAsync(Guid claimId)
    {
        var result = new VerificationResultDto();

        var claim = await _context.Claims.FindAsync(claimId);

        if (claim == null || !claim.IncidentLatitude.HasValue || !claim.IncidentLongitude.HasValue)
        {
            result.Message = "Claim or coordinates not found";
            return result;
        }

        var disasters = await GetDisastersAsync();

        const double DisasterRadiusKm = 10000;

        foreach (var disaster in disasters)
        {
            double distance = CalculateDistance(
                claim.IncidentLatitude.Value,
                claim.IncidentLongitude.Value,
                disaster.Lat,
                disaster.Lng
            );

            _logger.LogInformation(
                "Distance from claim to disaster {EventId}: {Distance} km",
                disaster.EventId,
                distance
            );

            if (distance <= DisasterRadiusKm)
            {
                result.IsVerified = true;

                result.MatchingDisasters.Add(
                    $"{disaster.EventType} recorded on {disaster.Date} (≈{distance:F1} km)"
                );

                if (result.MatchingDisasters.Count >= 5)
                    break;
            }
        }

        // -------------------------------------------------------
        // Nearby Claims Detection (Fraud Detection)
        // -------------------------------------------------------

        var nearbyClaims = await _context.Claims
            .Where(c => c.Id != claimId && c.Status != ClaimStatus.Rejected)
            .Where(c => c.IncidentLatitude.HasValue && c.IncidentLongitude.HasValue)
            .ToListAsync();

        int matchCount = 0;

        foreach (var nearby in nearbyClaims)
        {
            double dist = CalculateDistance(
                claim.IncidentLatitude.Value,
                claim.IncidentLongitude.Value,
                nearby.IncidentLatitude!.Value,
                nearby.IncidentLongitude!.Value
            );

            if (dist <= 5)
                matchCount++;
        }

        result.NearbyClaimsCount = matchCount;

        // -------------------------------------------------------
        // Risk Scoring
        // -------------------------------------------------------

        if (matchCount >= 3)
        {
            result.ConfidenceScore = 0.95;
            result.RiskFlag = false;
        }
        else if (matchCount > 0)
        {
            result.ConfidenceScore = 0.75;
            result.RiskFlag = false;
        }
        else
        {
            result.ConfidenceScore = 0.3;
            result.RiskFlag = !result.IsVerified;
        }

        result.Message = result.RiskFlag
            ? "High Risk: Isolated claim with no matching disaster data."
            : "Verified: Supported by nearby claims or disaster data.";

        _logger.LogInformation("Verification result: {Result}", result);
        return result;
    }

    // -------------------------------------------------------
    // HAVERSINE DISTANCE CALCULATION
    // -------------------------------------------------------

    private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371;

        double dLat = (lat2 - lat1) * Math.PI / 180.0;
        double dLon = (lon2 - lon1) * Math.PI / 180.0;

        double a =
            Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
            Math.Cos(lat1 * Math.PI / 180.0) *
            Math.Cos(lat2 * Math.PI / 180.0) *
            Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return R * c;
    }
}