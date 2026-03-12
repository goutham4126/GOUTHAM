using Application.DTOs.Insurance;

namespace Application.Interfaces
{
    public interface IAiDocumentService
    {
        Task<PolicyAiDocumentResponseDto?> GenerateDocumentSectionsAsync(PolicyAiDocumentRequestDto request);
    }
}
