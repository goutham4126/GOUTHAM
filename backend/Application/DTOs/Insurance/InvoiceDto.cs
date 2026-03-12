using Domain.Enums;

namespace Application.DTOs.Insurance
{
    public record InvoiceDto(
        Guid Id,
        string ReferenceId,
        string Type,
        string FileUrl,
        DateTime CreatedAt,
        decimal? Amount
    );
}
