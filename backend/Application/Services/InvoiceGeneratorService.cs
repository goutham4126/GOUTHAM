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

        // ══════════════════════════════════════════════════════════════════════
        //  PUBLIC METHODS  (logic unchanged)
        // ══════════════════════════════════════════════════════════════════════

        public byte[] GeneratePolicyInvoice(Policy policy, User customer)
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

        // ══════════════════════════════════════════════════════════════════════
        //  PAGE SETUP
        // ══════════════════════════════════════════════════════════════════════

        private void SetupPage(PageDescriptor page)
        {
            page.Size(PageSizes.A4);
            page.Margin(0);                      // margins handled per-section
            page.PageColor(IvoryBg);
            page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.TimesNewRoman).FontColor(SlateText));
        }

        // ══════════════════════════════════════════════════════════════════════
        //  HEADER
        // ══════════════════════════════════════════════════════════════════════

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

                        // Logo
                        var currentDir = Directory.GetCurrentDirectory();
                        var baseDir    = AppDomain.CurrentDomain.BaseDirectory;

                        var possiblePaths = new[]
                        {
                            Path.Combine(currentDir, "..", "Infrastructure", "Assets", "logo.png"),
                            Path.Combine(currentDir, "Infrastructure", "Assets", "logo.png"),
                            Path.Combine(baseDir, "..", "..", "..", "..", "Infrastructure", "Assets", "logo.png"),
                            @"c:\Users\DELL\Desktop\GOUTHAM\backend\Infrastructure\Assets\logo.png"
                        };

                        var actualLogoPath = possiblePaths.FirstOrDefault(System.IO.File.Exists);

                        if (actualLogoPath != null)
                            right.Item().PaddingTop(12).Height(38).AlignRight().Image(actualLogoPath).FitArea();
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

        // ══════════════════════════════════════════════════════════════════════
        //  CUSTOMER DETAILS
        // ══════════════════════════════════════════════════════════════════════

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

        // ══════════════════════════════════════════════════════════════════════
        //  POLICY DETAILS
        // ══════════════════════════════════════════════════════════════════════

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

        // ══════════════════════════════════════════════════════════════════════
        //  CLAIM DETAILS
        // ══════════════════════════════════════════════════════════════════════

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
    }
}
