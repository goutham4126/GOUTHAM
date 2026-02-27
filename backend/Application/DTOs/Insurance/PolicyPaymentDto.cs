namespace Application.DTOs.Insurance;

public record PolicyPaymentDto(
    Guid Id,
    decimal Amount,
    DateTime DueDate,
    DateTime? PaidDate,
    string Status
);