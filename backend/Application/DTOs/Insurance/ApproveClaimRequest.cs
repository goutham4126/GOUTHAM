namespace Application.DTOs.Insurance;

public record ApproveClaimRequest(decimal ApprovedAmount, string? Remarks);
