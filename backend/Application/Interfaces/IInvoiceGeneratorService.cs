using Domain.Entities;

namespace Application.Interfaces
{
    public interface IInvoiceGeneratorService
    {
        byte[] GeneratePolicyInvoice(Policy policy, User customer, Application.DTOs.Insurance.PolicyAiDocumentResponseDto? aiSections = null);
        byte[] GenerateClaimInvoice(Policy policy, Claim claim, User customer);
        byte[] GeneratePaymentInvoice(Policy policy, PolicyPayment payment, User customer);
    }
}
