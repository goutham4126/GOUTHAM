using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Google.Cloud.AIPlatform.V1;
using Google.Apis.Auth.OAuth2;
using Grpc.Auth;
using Microsoft.EntityFrameworkCore;
using Domain.Entities;

namespace Infrastructure.Services
{
    public class VertexAiChatbotService : IChatbotService
    {
        private readonly IAppDbContext _context;
        private readonly ILogger<VertexAiChatbotService> _logger;
        private readonly IConfiguration _config;
        private readonly string _projectId;
        private readonly string _location;
        private readonly string _modelId;
        private readonly string _credentialsPath;

        public VertexAiChatbotService(IAppDbContext context, ILogger<VertexAiChatbotService> logger, IConfiguration config)
        {
            _context = context;
            _logger = logger;
            _config = config;
            _projectId = _config["VertexAI:ProjectId"] ?? "xenon-lantern-490215-q3";
            _location = _config["VertexAI:Location"] ?? "us-central1";
            _modelId = _config["VertexAI:ModelId"] ?? "gemini-1.5-flash-001";
            _credentialsPath = _config["VertexAI:CredentialsPath"] ?? "c:\\Users\\DELL\\Desktop\\GOUTHAM\\xenon-lantern-490215-q3-80b745d4b121.json";
        }

        public async Task<List<Plan>> GetAvailablePlansAsync()
        {
            return await _context.Plans.Where(p => p.IsActive).ToListAsync();
        }

        public async Task<string> GetChatResponseAsync(string userMessage, string? planId = null)
        {
            try
            {
                string planContext = "";
                if (!string.IsNullOrEmpty(planId) && Guid.TryParse(planId, out var gPlanId))
                {
                    var plan = await _context.Plans.FindAsync(gPlanId);
                    if (plan != null)
                    {
                        planContext = $"\n\nCONTEXT - SELECTED PLAN:\nName: {plan.Name}\nDescription: {plan.Description}\nBenefits: {plan.Benefits}\nPremium: {plan.PremiumAmount}\nCoverage: {plan.CoverageAmount}";
                    }
                }

                var systemPrompt = @"You are the official Insure Chatbot. 
                    Your goal is to help customers understand our insurance plans and benefits.
                    Be professional, friendly, and factual. 
                    - If the user asks about a specific plan (provided in context), explain its benefits clearly.
                    - If the user asks general questions, guide them towards our plans.
                    - Do NOT provide medical or legal advice.
                    - Keep responses concise and easy to read.";

                var fullPrompt = $"{systemPrompt}{planContext}\n\nUser Message: {userMessage}";

                return await GenerateGeminiResponseAsync(fullPrompt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Chatbot error");
                return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a moment.";
            }
        }

        private async Task<string> GenerateGeminiResponseAsync(string prompt)
        {
            if (!System.IO.File.Exists(_credentialsPath))
            {
                _logger.LogError("Credentials file missing for chatbot");
                return "Service unavailable (Configuration is missing).";
            }

            var credential = (await GoogleCredential.FromFileAsync(_credentialsPath, CancellationToken.None))
                .CreateScoped("https://www.googleapis.com/auth/cloud-platform");

            var clientBuilder = new PredictionServiceClientBuilder
            {
                Endpoint = $"{_location}-aiplatform.googleapis.com",
                ChannelCredentials = credential.ToChannelCredentials()
            };

            var client = await clientBuilder.BuildAsync();
            var modelPath = $"projects/{_projectId}/locations/{_location}/publishers/google/models/{_modelId}";

            var request = new GenerateContentRequest
            {
                Model = modelPath,
                Contents =
                {
                    new Content
                    {
                        Role = "user",
                        Parts = { new Part { Text = prompt } }
                    }
                },
                GenerationConfig = new GenerationConfig
                {
                    Temperature = 0.5f,
                    MaxOutputTokens = 1000,
                    TopP = 0.8f,
                    TopK = 40
                }
            };

            var response = await client.GenerateContentAsync(request);
            if (response.Candidates.Count > 0 && response.Candidates[0].Content.Parts.Count > 0)
            {
                return response.Candidates[0].Content.Parts[0].Text;
            }

            return "I understood your message but I'm not sure how to respond. Could you rephrase that?";
        }
    }
}
