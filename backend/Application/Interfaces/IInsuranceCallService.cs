using Application.DTOs.Insurance;

namespace Application.Interfaces;

public interface IInsuranceCallService
{
    Task<InsuranceCallResponse> InitiateCallAsync(InitiateCallRequest request);
}
