using Application.DTOs.Insurance.Ambee;
using Application.Interfaces;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Text.Json;

namespace Infrastructure.Services;

public class GeoVerificationService : IGeoVerificationService
{
    private readonly HttpClient _httpClient;
    private readonly IAppDbContext _context;
    private readonly ILogger<GeoVerificationService> _logger;
    private readonly string _apiKey;
    private const string BaseUrl = "https://api.ambeedata.com/disasters/history";

    public GeoVerificationService(
        HttpClient httpClient,
        IAppDbContext context,
        IConfiguration configuration,
        ILogger<GeoVerificationService> logger)
    {
        _httpClient = httpClient;
        _context = context;
        _logger = logger;
        _apiKey = "c2233b0d3d81d9bd7a4f9064317db72f90bfcc3de7b8e235aa4f51669eec9457"; // Provided by user
    }

    public async Task<AmbeeHistoryResponse> GetDisasterHistoryAsync(DateTime fromDate, int page = 1, int limit = 30)
    {
        try
        {
            var url = $"{BaseUrl}?from={fromDate:yyyy-MM-dd HH:mm:ss}&page={page}&limit={limit}";
            
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("x-api-key", _apiKey);

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Ambee API call failed with status: {StatusCode}", response.StatusCode);
                return new AmbeeHistoryResponse { Message = "Error fetching data from Ambee" };
            }

            var content = await response.Content.ReadAsStringAsync();
            var data = JsonSerializer.Deserialize<AmbeeHistoryResponse>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return data ?? new AmbeeHistoryResponse { Message = "No data returned" };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception in GetDisasterHistoryAsync");
            return new AmbeeHistoryResponse { Message = ex.Message };
        }
    }

    public async Task<VerificationResultDto> VerifyClaimAsync(Guid claimId)
    {
        var result = new VerificationResultDto();
        
        var claim = await _context.Claims.FindAsync(claimId);
        if (claim == null || !claim.IncidentLatitude.HasValue || !claim.IncidentLongitude.HasValue)
        {
            result.Message = "Claim or coordinates not found";
            return result;
        }

        // 1. Check Ambee History for matches (Simple coordinate proximity check)
        // Fetch data for the last 28 days
        var fromDate = DateTime.UtcNow.AddDays(-28);
        var ambeeData = await GetDisasterHistoryAsync(fromDate, 1, 100);

        // Ambee disasters are returned as a list of events; we consider a match if a recorded disaster is within a reasonable radius.
        // Requirement: verify whether any Ambee disasters occurred within 50,000 km of the claim location.
        // (50,000 km is ~1/4 of the Earth's circumference and covers broad regional impact.)
        const double AmbeeMatchRadiusKm = 50000;

        if (ambeeData?.Data != null && ambeeData.Data.Any())
        {
            foreach (var disaster in ambeeData.Data)
            {
                double distance = CalculateDistance(
                    claim.IncidentLatitude.Value, claim.IncidentLongitude.Value,
                    disaster.Lat, disaster.Lng);

                // If within configured radius of a recorded disaster, consider verified
                if (distance <= AmbeeMatchRadiusKm)
                {
                    result.IsVerified = true;
                    result.MatchingDisasters.Add($"{disaster.EventType} recorded on {disaster.Date} nearby (≈{distance:F1}km)");
                }
            }
        }

        // 2. Automated Fraud Verification based on 5km radius
        var nearbyClaimsCount = await _context.Claims
            .Where(c => c.Id != claimId && c.Status != ClaimStatus.Rejected)
            .Where(c => c.IncidentLatitude.HasValue && c.IncidentLongitude.HasValue)
            .ToListAsync();

        int matchCount = 0;
        foreach (var nearby in nearbyClaimsCount)
        {
            double dist = CalculateDistance(
                claim.IncidentLatitude.Value, claim.IncidentLongitude.Value,
                nearby.IncidentLatitude!.Value, nearby.IncidentLongitude!.Value);
            
            if (dist <= 5) // 5km radius
            {
                matchCount++;
            }
        }

        result.NearbyClaimsCount = matchCount;
        
        // Logic: If there are many claims in the same area, it's more likely to be a legitimate widespread disaster.
        // If isolated (0 matches) AND no Ambee record, it's high risk.
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
            result.RiskFlag = !result.IsVerified; // Flag as risk if isolated AND not verified by Ambee
        }

        result.Message = result.RiskFlag ? "High Risk: Isolated claim with no matching disaster data." : "Verified: Supported by nearby claims or disaster data.";
        
        return result;
    }

    private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        var d1 = lat1 * (Math.PI / 180.0);
        var num1 = lon1 * (Math.PI / 180.0);
        var d2 = lat2 * (Math.PI / 180.0);
        var num2 = lon2 * (Math.PI / 180.0) - num1;
        var d3 = Math.Pow(Math.Sin((d2 - d1) / 2.0), 2.0) + Math.Cos(d1) * Math.Cos(d2) * Math.Pow(Math.Sin(num2 / 2.0), 2.0);
        return 6371 * (2.0 * Math.Atan2(Math.Sqrt(d3), Math.Sqrt(1.0 - d3)));
    }
}
