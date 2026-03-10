using System.Net.Http.Headers;
using System.Text.Json;
using Application.Interfaces;

namespace Application.Services
{
    public class VercelBlobService : IVercelBlobService
    {
        private readonly HttpClient _httpClient;
        private readonly string _token;

        public VercelBlobService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _token = "vercel_blob_rw_4OHZLzvph4cjPlYE_0S3ZUwOy6HEbYx8l8AgTQp7gCjKDVW";
        }

        public async Task<string> UploadFileAsync(byte[] file, string fileName, string folderName, string contentType = "application/pdf")
        {
            var requestUrl = $"https://blob.vercel-storage.com/{folderName}/{fileName}";

            using var request = new HttpRequestMessage(HttpMethod.Put, requestUrl);
            
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _token);
            request.Content = new ByteArrayContent(file);
            request.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var responseBody = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<VercelBlobResponse>(responseBody, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            return result?.Url ?? throw new Exception("Failed to get URL from Vercel Blob.");
        }

        private class VercelBlobResponse
        {
            public string Url { get; set; } = string.Empty;
        }
    }
}
