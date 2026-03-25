using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Google.Cloud.AIPlatform.V1;
using Google.Apis.Auth.OAuth2;
using Grpc.Auth;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Infrastructure.Services
{
    public class VertexAiService : IVertexAiService
    {
        private readonly IAppDbContext _context;
        private readonly ILogger<VertexAiService> _logger;
        private readonly IConfiguration _config;
        private readonly string _projectId;
        private readonly string _location;
        private readonly string _modelId;
        private readonly string _credentialsPath;

        public VertexAiService(IAppDbContext context, ILogger<VertexAiService> logger, IConfiguration config)
        {
            _context = context;
            _logger = logger;
            _config = config;
            _projectId = _config["VertexAI:ProjectId"] ?? "xenon-lantern-490215-q3";
            _location = _config["VertexAI:Location"] ?? "us-central1";
            _modelId = _config["VertexAI:ModelId"] ?? "gemini-1.5-flash";
            _credentialsPath = _config["VertexAI:CredentialsPath"] ?? "c:\\Users\\DELL\\Desktop\\GOUTHAM\\xenon-lantern-490215-q3-80b745d4b121.json";
        }

        public async Task<string> SummarizeClaimAsync(Guid claimId)
        {
            try
            {
                var claim = await _context.Claims
                    .Include(c => c.User)
                    .FirstOrDefaultAsync(c => c.Id == claimId);

                if (claim == null) return "Claim not found.";

                var prompt = $@"
                    You are an AI assistant helping an insurance claims officer.

                    Your task is to analyze the claim and generate a structured, professional summary.

                    STRICT INSTRUCTIONS:
                    - Do NOT use markdown, bold, or special formatting.
                    - Do NOT truncate the response.
                    - Write a detailed paragraph (at least 100–150 words)
                    - Use plain text only.
                    - Be concise, factual, and professional.

                    OUTPUT FORMAT (follow EXACTLY):

                    Summary:
                    <5-6 sentence summary of the claim explaining everything about claim>

                    Core Issue:
                    <short description>

                    Claim Amount:
                    <amount>

                    Risk Flags:
                    - <flag 1>
                    - <flag 2>
                    (If no risks, write: None)

                    CLAIM DETAILS:
                    ID: {claim.Id}
                    Reason: {claim.Reason}
                    Amount: ₹{claim.ClaimAmount}
                    Status: {claim.Status}
                    Incident Date: {claim.IncidentDate:yyyy-MM-dd}
                    Customer Name: {claim.User.FirstName} {claim.User.LastName}
                    Contact: {claim.User.Email}, {claim.User.Phone}
                    ";

                return await GenerateAiInsightsAsync(prompt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to summarize claim {ClaimId}", claimId);
                return "Error generating AI summary. Please try again later.";
            }
        }

        public async Task<string> GenerateAiInsightsAsync(string prompt)
        {
            try
            {
                _logger.LogInformation("Calling Vertex AI Gemini for prompt");

                if (!System.IO.File.Exists(_credentialsPath))
                {
                    _logger.LogError("Credentials file not found: {Path}", _credentialsPath);
                    return "Configuration error: Credentials file missing.";
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
                            Parts =
                            {
                                new Part { Text = prompt }
                            }
                        }
                    },
                    GenerationConfig = new GenerationConfig
                    {
                        Temperature = 0.2f,
                        MaxOutputTokens = 1000,
                        TopP = 0.8f,
                        TopK = 40
                    }
                };

                var response = await client.GenerateContentAsync(request);

                var text = response.Candidates[0].Content.Parts[0].Text;

                return text;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Vertex AI Gemini call failed");
                return "AI Summarization Service is currently unavailable.";
            }
        }
    }
}
