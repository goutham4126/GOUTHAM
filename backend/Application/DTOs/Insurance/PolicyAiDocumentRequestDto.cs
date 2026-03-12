namespace Application.DTOs.Insurance
{
    public class PolicyAiDocumentRequestDto
    {
        public string PolicyId { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string PlanName { get; set; } = string.Empty;
        public decimal CoverageAmount { get; set; }
        public int PolicyDurationMonths { get; set; }
        public string PaymentFrequency { get; set; } = string.Empty;
        public decimal TotalPremium { get; set; }
        public string PolicyStartDate { get; set; } = string.Empty;
        public string PolicyCompletionDate { get; set; } = string.Empty;
    }
}
