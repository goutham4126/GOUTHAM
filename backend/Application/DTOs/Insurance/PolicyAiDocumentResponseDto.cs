namespace Application.DTOs.Insurance
{
    public class PolicyAiDocumentResponseDto
    {
        public string PolicyId { get; set; } = string.Empty;
        public string PlanDetails { get; set; } = string.Empty;
        public string PolicySchedule { get; set; } = string.Empty;
        public string CoverageExplanation { get; set; } = string.Empty;
        public string RiskDeclaration { get; set; } = string.Empty;
        public string TermsAndConditions { get; set; } = string.Empty;
    }
}
