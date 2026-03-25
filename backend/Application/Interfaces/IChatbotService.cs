namespace Application.Interfaces
{
    public interface IChatbotService
    {
        Task<string> GetChatResponseAsync(string userMessage, string? planId = null);
        Task<List<Domain.Entities.Plan>> GetAvailablePlansAsync();
    }
}
