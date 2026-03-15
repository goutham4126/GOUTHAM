namespace Application.DTOs.Insurance;

public record KycDetailsDto(
    Guid Id,
    Guid UserId,
    string PanNumber,
    string? PanName,
    string? PanDob,
    string AadhaarReferenceId,
    string? AadhaarName,
    string? AadhaarGender,
    string? AadhaarDob,
    string? AadhaarAddress,
    string? AadhaarPhotoBase64,
    DateTime VerifiedAt
);
