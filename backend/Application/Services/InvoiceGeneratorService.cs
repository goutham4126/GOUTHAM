using Application.Interfaces;
using Domain.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Application.Services
{
    public class InvoiceGeneratorService : IInvoiceGeneratorService
    {
        // ── Palette ────────────────────────────────────────────────────────────
        private static readonly string NavyDeep    = "#0B1B3D";
        private static readonly string NavyMid     = "#122251";
        private static readonly string GoldPrimary = "#C9A84C";
        private static readonly string GoldLight   = "#E8C97A";
        private static readonly string IvoryBg     = "#FAFAF7";
        private static readonly string IvoryCard   = "#F4F3EE";
        private static readonly string SlateText   = "#3A3A4A";
        private static readonly string MutedText   = "#8A8A9A";
        private static readonly string DividerLine = "#DDD9CE";
        private static readonly string White       = "#FFFFFF";
        private static readonly string SuccessGreen = "#2D6A4F";
        private static readonly string WarnAmber   = "#B45309";

        public InvoiceGeneratorService()
        {
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public byte[] GeneratePolicyInvoice(Policy policy, User customer, Application.DTOs.Insurance.PolicyAiDocumentResponseDto? aiSections = null)
        {
            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    SetupPage(page);
                    page.Header().Element(c => ComposeHeader(c, "Policy Purchase Invoice", policy.Id.ToString(), policy.StartDate));
                    page.Content().Element(c =>
                    {
                        c.PaddingVertical(1, Unit.Centimetre).Column(col =>
                        {
                            ComposeCustomerDetails(col, customer);
                            col.Item().PaddingTop(25).Element(c2 => ComposePolicyDetails(c2, policy));
                            
                            col.Item().PaddingTop(20).Element(c2 => ComposePremiumBreakdown(c2, policy));
                            
                            if (aiSections != null)
                            {
                                col.Item().PaddingTop(20).Element(c2 => ComposeAiSections(c2, aiSections));
                            }
                        });
                    });
                    page.Footer().Element(ComposeFooter);
                });
            }).GeneratePdf();
        }

        public byte[] GenerateClaimInvoice(Policy policy, Claim claim, User customer)
        {
            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    SetupPage(page);
                    page.Header().Element(c => ComposeHeader(c, $"Claim Invoice", claim.Id.ToString(), claim.ProcessedAt ?? claim.SubmittedAt, claim.Status.ToString()));
                    page.Content().Element(c =>
                    {
                        c.PaddingVertical(1, Unit.Centimetre).Column(col =>
                        {
                            ComposeCustomerDetails(col, customer);
                            col.Item().PaddingTop(20).Element(c2 => ComposePolicyDetails(c2, policy));
                            col.Item().PaddingTop(20).Element(c2 => ComposeClaimDetails(c2, claim));
                        });
                    });
                    page.Footer().Element(ComposeFooter);
                });
            }).GeneratePdf();
        }

        public byte[] GeneratePaymentInvoice(Policy policy, PolicyPayment payment, User customer)
        {
            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    SetupPage(page);
                    page.Header().Element(c => ComposeHeader(c, "Payment Receipt", payment.Id.ToString(), payment.PaidDate ?? payment.DueDate));
                    page.Content().Element(c =>
                    {
                        c.PaddingVertical(1, Unit.Centimetre).Column(col =>
                        {
                            ComposeCustomerDetails(col, customer);
                            col.Item().PaddingTop(20).Element(c2 => ComposePolicyDetails(c2, policy));
                            col.Item().PaddingTop(20).Element(c2 => ComposePaymentDetails(c2, payment));
                        });
                    });
                    page.Footer().Element(ComposeFooter);
                });
            }).GeneratePdf();
        }


        private void SetupPage(PageDescriptor page)
        {
            page.Size(PageSizes.A4);
            page.Margin(0);                      // margins handled per-section
            page.PageColor(IvoryBg);
            page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.TimesNewRoman).FontColor(SlateText));
        }

        private void ComposeHeader(IContainer container, string title, string referenceNumber,
                                   DateTime issueDate, string? badge = null)
        {
            container.Column(col =>
            {
                // ── Dark navy banner ──────────────────────────────────────────
                col.Item().Background(NavyDeep).Padding(30).Row(row =>
                {
                    // Left: branding block
                    row.RelativeItem().Column(left =>
                    {
                        // Company name / logo area
                        left.Item().Row(r =>
                        {
                            // Gold accent bar
                            r.ConstantItem(4).Background(GoldPrimary);
                            r.ConstantItem(12);

                            r.RelativeItem().Column(brand =>
                            {
                                brand.Item().Text("INSURE")
                                    .FontSize(22)
                                    .Bold()
                                    .FontFamily(Fonts.Georgia)
                                    .FontColor(White)
                                    .LetterSpacing(0.15f);
                            });
                        });

                        left.Item().PaddingTop(22);

                        // Document title
                        left.Item().Text(title)
                            .FontSize(18)
                            .FontFamily(Fonts.Georgia)
                            .FontColor(GoldLight)
                            .Italic();

                        // Optional status badge
                        if (!string.IsNullOrEmpty(badge))
                        {
                            left.Item().PaddingTop(6).Decoration(decoration =>
                            {
                                decoration.Before().Width(70).Background(GoldPrimary)
                                    .Padding(4)
                                    .AlignCenter()
                                    .Text(badge.ToUpper())
                                    .FontSize(7.5f)
                                    .Bold()
                                    .FontColor(NavyDeep)
                                    .LetterSpacing(0.1f);
                                decoration.Content();
                            });
                        }
                    });

                    // Right: reference meta
                    row.ConstantItem(180).AlignBottom().Column(right =>
                    {
                        right.Item().PaddingBottom(6).LineHorizontal(0.5f).LineColor(GoldPrimary + "66");

                        MetaLine(right, "REFERENCE NO.", referenceNumber);
                        MetaLine(right, "ISSUE DATE", issueDate.ToString("dd MMM yyyy").ToUpper());
                    });
                });

                // ── Gold rule beneath banner ──────────────────────────────────
                col.Item().Height(3).Background(GoldPrimary);
            });
        }

        private static void MetaLine(ColumnDescriptor col, string label, string value)
        {
            col.Item().PaddingTop(4).Row(r =>
            {
                r.RelativeItem().Text(label)
                    .FontSize(6.5f)
                    .FontColor(MutedText)
                    .LetterSpacing(0.15f);
            });
            col.Item().Text(value)
                .FontSize(9.5f)
                .Bold()
                .FontColor(White);
        }


        private void ComposeCustomerDetails(ColumnDescriptor column, User customer)
        {
            column.Item().PaddingHorizontal(30).Element(c =>
            {
                c.Column(inner =>
                {
                    SectionLabel(inner, "BILLED TO");

                    inner.Item().PaddingTop(8).Row(row =>
                    {
                        // Avatar / initials block
                        var initials = $"{customer.FirstName?[0]}{customer.LastName?[0]}".ToUpper();
                        row.ConstantItem(48).Height(48)
                            .Background(NavyMid)
                            .AlignCenter()
                            .AlignMiddle()
                            .Text(initials)
                            .FontSize(17)
                            .Bold()
                            .FontFamily(Fonts.Georgia)
                            .FontColor(GoldLight);

                        row.ConstantItem(14);

                        row.RelativeItem().AlignMiddle().Column(info =>
                        {
                            info.Item().Text($"{customer.FirstName} {customer.LastName}")
                                .FontSize(14)
                                .Bold()
                                .FontFamily(Fonts.Georgia)
                                .FontColor(NavyDeep);

                            info.Item().PaddingTop(2).Text(customer.Email)
                                .FontSize(9)
                                .FontColor(MutedText);

                            if (!string.IsNullOrEmpty(customer.Phone))
                                info.Item().Text(customer.Phone)
                                    .FontSize(9)
                                    .FontColor(MutedText);
                        });
                    });

                    inner.Item().PaddingTop(16).LineHorizontal(0.75f).LineColor(DividerLine);
                });
            });
        }

        private void ComposePolicyDetails(IContainer container, Policy policy)
        {
            var plan             = policy.Plan;
            var durationMonths   = policy.DurationInMonths;
            var planDefaultMonths = plan?.DurationInMonths ?? durationMonths;
            var baseCoverage     = policy.PlanBaseCoverageAmount;
            var basePremium      = policy.PlanBasePremiumAmount;
            var yourCoverage     = policy.CoverageAmount;

            container.PaddingHorizontal(30).Column(col =>
            {
                SectionLabel(col, "POLICY & PLAN DETAILS");

                // ── Plan hero card ────────────────────────────────────────────
                col.Item().PaddingTop(10).Background(NavyDeep).Padding(18).Row(row =>
                {
                    row.RelativeItem().Column(left =>
                    {
                        left.Item().Text(plan?.Name ?? "N/A")
                            .FontSize(16)
                            .Bold()
                            .FontFamily(Fonts.Georgia)
                            .FontColor(White);

                        left.Item().PaddingTop(4).Text($"{durationMonths}-Month Policy")
                            .FontSize(9)
                            .FontColor(GoldLight);
                    });

                    row.ConstantItem(1).Background(GoldPrimary + "44");
                    row.ConstantItem(20);

                    row.ConstantItem(130).Column(right =>
                    {
                        right.Item().Text("YOUR COVERAGE")
                            .FontSize(6.5f)
                            .FontColor(MutedText)
                            .LetterSpacing(0.15f);

                        right.Item().PaddingTop(2).Text($"${yourCoverage:N0}")
                            .FontSize(22)
                            .Bold()
                            .FontFamily(Fonts.Georgia)
                            .FontColor(GoldPrimary);

                        right.Item().Text($"Base: ${baseCoverage:N0} / {planDefaultMonths}mo")
                            .FontSize(8)
                            .FontColor(MutedText);
                    });
                });

                // ── Key dates pill row ────────────────────────────────────────
                col.Item().PaddingTop(10).Row(row =>
                {
                    DatePill(row, "START DATE",  policy.StartDate.ToString("dd MMM yyyy"));
                    row.ConstantItem(10);
                    DatePill(row, "END DATE",    policy.EndDate.ToString("dd MMM yyyy"));
                    row.ConstantItem(10);
                    DatePill(row, "STATUS",      policy.Status.ToString(), highlight: true);
                });

                // ── Financial summary ─────────────────────────────────────────
                col.Item().PaddingTop(18).Text("Financial Summary")
                    .FontSize(10)
                    .Bold()
                    .FontColor(NavyDeep)
                    .LetterSpacing(0.05f);

                col.Item().PaddingTop(6).Element(c => ElegantTable(c,
                    new[] { "Base Premium", "Payment Frequency", "Total Premium", "Policy Status" },
                    new[] {
                        $"${basePremium:N2} / month",
                        policy.PaymentFrequency.ToString(),
                        $"${policy.TotalPremium:N2}",
                        policy.Status.ToString()
                    },
                    highlightLast: false));

                col.Item().PaddingTop(16).LineHorizontal(0.75f).LineColor(DividerLine);
            });
        }

        private void ComposePremiumBreakdown(IContainer container, Policy policy)
        {
            var plan = policy.Plan;
            var riskScore = CalculateRiskScore(plan, policy.DurationInMonths, policy.PaymentFrequency);
            
            int frequencyInterval = policy.PaymentFrequency switch
            {
                Domain.Enums.PaymentFrequency.Monthly => 1,
                Domain.Enums.PaymentFrequency.Quarterly => 3,
                Domain.Enums.PaymentFrequency.Yearly => 12,
                _ => 1
            };
            string frequencyLabel = policy.PaymentFrequency switch
            {
                Domain.Enums.PaymentFrequency.Monthly => "mo",
                Domain.Enums.PaymentFrequency.Quarterly => "qtr",
                Domain.Enums.PaymentFrequency.Yearly => "yr",
                _ => "mo"
            };

            decimal baseMonthlyPremium = plan?.PremiumAmount ?? 0;
            decimal baseInstallment = baseMonthlyPremium * frequencyInterval;
            decimal riskAdjustmentAmount = baseInstallment * (riskScore / 100m);
            decimal adjustedInstallment = baseInstallment + riskAdjustmentAmount;
            int numberOfInstallments = policy.DurationInMonths / frequencyInterval;

            string riskLabel = riskScore <= 15 ? "Low" :
                               riskScore <= 30 ? "Moderate" :
                               riskScore <= 50 ? "High" : "Severe";
            
            string riskColor = riskScore <= 15 ? SuccessGreen :
                               riskScore <= 30 ? WarnAmber :
                               riskScore <= 50 ? "#b78a52ff" : "#B91C1C"; // PDF safe colors for Orange/Red

            container.PaddingHorizontal(30).Column(col =>
            {
                SectionLabel(col, "PREMIUM CALCULATION BREAKDOWN");

                col.Item().PaddingTop(10).Border(0.5f).BorderColor(DividerLine).Column(card =>
                {
                    void AddRow(string title, string subtitle, string value, string valueSuffix = "", bool isHighlighted = false, bool isTotal = false)
                    {
                        card.Item().Background(isTotal ? NavyDeep : White)
                            .BorderBottom(isTotal ? 0 : 0.5f).BorderColor(DividerLine)
                            .PaddingVertical(8).PaddingHorizontal(12).Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text(title).FontSize(isTotal ? 11 : 9.5f).Bold().FontColor(isTotal ? White : NavyDeep);
                                if (!string.IsNullOrEmpty(subtitle))
                                {
                                    c.Item().Text(subtitle).FontSize(7.5f).FontColor(isTotal ? GoldLight : MutedText);
                                }
                            });
                            
                            row.ConstantItem(120).AlignRight().AlignMiddle().Text(t =>
                            {
                                t.Span(value).FontSize(isTotal ? 14 : 10.5f).Bold().FontColor(isTotal ? White : NavyDeep);
                                if (!string.IsNullOrEmpty(valueSuffix))
                                {
                                    t.Span(valueSuffix).FontSize(7.5f).Bold().FontColor(isTotal ? GoldLight : MutedText);
                                }
                            });
                        });
                    }

                    void AddRiskRow(string title, string subtitle, string value)
                    {
                        card.Item().Background(White)
                            .BorderBottom(0.5f).BorderColor(DividerLine)
                            .PaddingVertical(8).PaddingHorizontal(12).Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text(t => {
                                    t.Span("● ").FontSize(8).FontColor(riskColor);
                                    t.Span(title).FontSize(9.5f).Bold().FontColor(riskColor);
                                });
                                c.Item().Text(subtitle).FontSize(7.5f).FontColor(MutedText);
                            });
                            
                            row.ConstantItem(120).AlignRight().AlignMiddle()
                                .Text(value).FontSize(10.5f).Bold().FontColor(riskColor);
                        });
                    }

                    AddRow("Coverage Amount", $"{plan?.Name}  ·  {policy.DurationInMonths} months", $"${policy.CoverageAmount:N0}");
                    AddRow("Base Premium", "Plan's monthly rate", $"${baseMonthlyPremium:N2}", " /mo");
                    AddRow("Frequency Multiplier", $"{policy.PaymentFrequency} = × {frequencyInterval} months", $"× {frequencyInterval}");
                    AddRow("Base Installment", $"${baseMonthlyPremium:N2} × {frequencyInterval}", $"${baseInstallment:N2}", $" /{frequencyLabel}", isHighlighted: true);
                    
                    AddRiskRow($"Risk Adjustment ({riskLabel})", $"+{riskScore:N1}% of base installment", $"+${riskAdjustmentAmount:N2}");
                    
                    AddRow("Adjusted Installment", "Base + Risk adjustment", $"${adjustedInstallment:N2}", $" /{frequencyLabel}", isHighlighted: true);
                    AddRow("Number of Installments", $"{policy.DurationInMonths} months ÷ {frequencyInterval} = {numberOfInstallments} installments", $"× {numberOfInstallments}");
                    AddRow("Total Premium", $"${adjustedInstallment:N2} × {numberOfInstallments} installments", $"${policy.TotalPremium:N2}", isTotal: true);
                });
            });
        }

        private void ComposeClaimDetails(IContainer container, Claim claim)
        {
            container.PaddingHorizontal(30).Column(col =>
            {
                SectionLabel(col, "CLAIM DETAILS");

                col.Item().PaddingTop(10).Element(c => ElegantTable(c,
                    new[] { "Claim Amount", "Status", "Reason", "Approved Amount" },
                    new[] {
                        $"${claim.ClaimAmount:N2}",
                        claim.Status.ToString(),
                        claim.Reason,
                        claim.ApprovedAmount.HasValue ? $"${claim.ApprovedAmount:N2}" : "Pending"
                    },
                    highlightLast: claim.ApprovedAmount.HasValue));

                col.Item().PaddingTop(16).LineHorizontal(0.75f).LineColor(DividerLine);
            });
        }

        private void ComposeAiSections(IContainer container, Application.DTOs.Insurance.PolicyAiDocumentResponseDto aiSections)
        {
            container.PaddingHorizontal(30).Column(col =>
            {
                if (!string.IsNullOrWhiteSpace(aiSections.PlanDetails))
                {
                    SectionLabel(col, "PLAN DETAILS");
                    col.Item().PaddingTop(8).Text(aiSections.PlanDetails)
                        .FontSize(9.5f).FontColor(SlateText).LineHeight(1.4f);
                }

                if (!string.IsNullOrWhiteSpace(aiSections.PolicySchedule))
                {
                    SectionLabel(col, "POLICY SCHEDULE");
                    col.Item().PaddingTop(8).Text(aiSections.PolicySchedule)
                        .FontSize(9.5f).FontColor(SlateText).LineHeight(1.4f);
                }

                if (!string.IsNullOrWhiteSpace(aiSections.CoverageExplanation))
                {
                    SectionLabel(col, "COVERAGE EXPLANATION");
                    col.Item().PaddingTop(8).Text(aiSections.CoverageExplanation)
                        .FontSize(9.5f).FontColor(SlateText).LineHeight(1.4f);
                }

                if (!string.IsNullOrWhiteSpace(aiSections.RiskDeclaration))
                {
                    SectionLabel(col, "RISK DECLARATION");
                    col.Item().PaddingTop(8).Text(aiSections.RiskDeclaration)
                        .FontSize(9.5f).FontColor(SlateText).LineHeight(1.4f);
                }

                if (!string.IsNullOrWhiteSpace(aiSections.TermsAndConditions))
                {
                    SectionLabel(col, "TERMS & CONDITIONS");
                    col.Item().PaddingTop(8).Text(aiSections.TermsAndConditions)
                        .FontSize(9.5f).FontColor(SlateText).LineHeight(1.4f);
                }
            });
        }

        // ══════════════════════════════════════════════════════════════════════
        //  PAYMENT DETAILS
        // ══════════════════════════════════════════════════════════════════════

        private void ComposePaymentDetails(IContainer container, PolicyPayment payment)
        {
            container.PaddingHorizontal(30).Column(col =>
            {
                SectionLabel(col, "PAYMENT DETAILS");

                col.Item().PaddingTop(10).Element(c => ElegantTable(c,
                    new[] { "Amount", "Status", "Due Date", "Paid Date" },
                    new[] {
                        $"${payment.Amount:N2}",
                        payment.Status.ToString(),
                        payment.DueDate.ToString("dd MMM yyyy"),
                        payment.PaidDate?.ToString("dd MMM yyyy") ?? "N/A"
                    },
                    highlightLast: payment.PaidDate.HasValue));

                col.Item().PaddingTop(16).LineHorizontal(0.75f).LineColor(DividerLine);
            });
        }

        // ══════════════════════════════════════════════════════════════════════
        //  FOOTER
        // ══════════════════════════════════════════════════════════════════════

        private void ComposeFooter(IContainer container)
        {
            container.Column(col =>
            {
                col.Item().Height(3).Background(GoldPrimary);

                col.Item().Background(NavyDeep).PaddingHorizontal(30).PaddingVertical(14).Row(row =>
                {
                    row.RelativeItem().AlignMiddle().Text("INSURE  ·  All Rights Reserved")
                        .FontSize(7.5f)
                        .FontColor(MutedText)
                        .LetterSpacing(0.1f);

                    row.ConstantItem(120).AlignRight().AlignMiddle().Text(x =>
                    {
                        x.Span("Page ").FontSize(8).FontColor(MutedText);
                        x.CurrentPageNumber().FontSize(8).Bold().FontColor(GoldLight);
                        x.Span(" of ").FontSize(8).FontColor(MutedText);
                        x.TotalPages().FontSize(8).Bold().FontColor(GoldLight);
                    });
                });
            });
        }

        // ══════════════════════════════════════════════════════════════════════
        //  HELPERS
        // ══════════════════════════════════════════════════════════════════════

        private static void SectionLabel(ColumnDescriptor col, string label)
        {
            col.Item().PaddingTop(20).Row(row =>
            {
                row.ConstantItem(3).Background(GoldPrimary);
                row.ConstantItem(10);
                row.RelativeItem().AlignMiddle()
                    .Text(label)
                    .FontSize(7.5f)
                    .Bold()
                    .FontColor(NavyDeep)
                    .LetterSpacing(0.2f);
            });
        }

        private static void DatePill(RowDescriptor row, string label, string value, bool highlight = false)
        {
            row.RelativeItem()
                .Background(highlight ? NavyDeep : IvoryCard)
                .Border(0.75f)
                .BorderColor(highlight ? GoldPrimary : DividerLine)
                .Padding(10)
                .Column(col =>
                {
                    col.Item().Text(label)
                        .FontSize(6.5f)
                        .FontColor(highlight ? GoldLight : MutedText)
                        .LetterSpacing(0.15f);

                    col.Item().PaddingTop(3).Text(value)
                        .FontSize(10)
                        .Bold()
                        .FontFamily(Fonts.Georgia)
                        .FontColor(highlight ? GoldPrimary : NavyDeep);
                });
        }

        /// <summary>Renders a label-value table with alternating row shading and a gold-accented header row.</summary>
        private static void ElegantTable(IContainer container, string[] headers, string[] values, bool highlightLast)
        {
            container.Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    foreach (var _ in headers)
                        cols.RelativeColumn();
                });

                // Header row
                foreach (var h in headers)
                {
                    table.Cell()
                        .Background(NavyDeep)
                        .BorderRight(0.5f).BorderColor(NavyMid)
                        .PaddingVertical(9).PaddingHorizontal(10)
                        .Text(h)
                        .FontSize(7.5f)
                        .Bold()
                        .FontColor(GoldLight)
                        .LetterSpacing(0.1f);
                }

                // Value row
                for (int i = 0; i < values.Length; i++)
                {
                    bool isLast   = i == values.Length - 1;
                    bool useGold  = isLast && highlightLast;

                    var cell = table.Cell()
                        .Background(i % 2 == 0 ? White : IvoryCard)
                        .BorderRight(0.5f).BorderColor(DividerLine)
                        .BorderBottom(1f).BorderColor(DividerLine)
                        .PaddingVertical(9).PaddingHorizontal(10)
                        .DefaultTextStyle(x =>
                        {
                            x = x.FontSize(useGold ? 11 : 10)
                                 .FontColor(useGold ? SuccessGreen : SlateText);
                            return useGold ? x.Bold() : x;
                        });

                    cell.Text(values[i]);
                }
            });
        }

         private static decimal CalculateRiskScore(Plan? plan, int durationMonths, Domain.Enums.PaymentFrequency frequency)
        {
            if (plan == null) return 0m;
            decimal score = 5m; // Base score

            // Plan Risk
            if (plan.PlanType != null && plan.PlanType.Contains("Disaster", StringComparison.OrdinalIgnoreCase))
            {
                score += 20m;
            }
            else
            {
                score += 15m;
            }

            // Duration Risk
            decimal durationYears = durationMonths / 12.0m;
            score += Math.Min(15m, 1.2m * durationYears);

            // Frequency Risk
            if (frequency == Domain.Enums.PaymentFrequency.Monthly)
                score += 6m;
            else if (frequency == Domain.Enums.PaymentFrequency.Quarterly)
                score += 3m;

            // Coverage Risk
            decimal defaultDuration = plan.DurationInMonths > 0 ? plan.DurationInMonths : durationMonths;
            decimal computedCoverage = plan.CoverageAmount * ((decimal)durationMonths / defaultDuration);
            score += Math.Min(15m, (computedCoverage / 500000m) * 2m);

            return Math.Min(100m, score);
        }
    }
}
