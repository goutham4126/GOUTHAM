namespace Application.Interfaces
{
    public interface IVertexAiService
    {
        Task<string> SummarizeClaimAsync(Guid claimId);
        Task<string> GenerateAiInsightsAsync(string prompt);
    }
}
