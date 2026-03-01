using Application.Interfaces;
using Domain.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Infrastructure.Services
{
    public class InvoiceGeneratorService : IInvoiceGeneratorService
    {
        public InvoiceGeneratorService()
        {
            QuestPDF.Settings.License = LicenseType.Community;
        }

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
                    page.Header().Element(c => ComposeHeader(c, $"Claim Invoice - {claim.Status}", claim.Id.ToString(), claim.ProcessedAt ?? claim.SubmittedAt));
                    page.Content().Element(c =>
                    {
                        c.PaddingVertical(1, Unit.Centimetre).Column(col =>
                        {
                            ComposeCustomerDetails(col, customer);
                            col.Item().PaddingTop(15).Element(c2 => ComposePolicyDetails(c2, policy));
                            col.Item().PaddingTop(15).Element(c2 => ComposeClaimDetails(c2, claim));
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
                            col.Item().PaddingTop(15).Element(c2 => ComposePolicyDetails(c2, policy));
                            col.Item().PaddingTop(15).Element(c2 => ComposePaymentDetails(c2, payment));
                        });
                    });
                    page.Footer().Element(ComposeFooter);
                });
            }).GeneratePdf();
        }

        private void SetupPage(PageDescriptor page)
        {
            page.Size(PageSizes.A4);
            page.Margin(2, Unit.Centimetre);
            page.PageColor(Colors.White);
            page.DefaultTextStyle(x => x.FontSize(11).FontFamily(Fonts.Arial));
        }

        private void ComposeHeader(IContainer container, string title, string referenceNumber, DateTime issueDate)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text(title).FontSize(24).SemiBold().FontColor(Colors.Blue.Darken2);

                    column.Item().PaddingTop(5).Text(text =>
                    {
                        text.Span("Reference No: ").SemiBold();
                        text.Span(referenceNumber);
                    });

                    column.Item().Text(text =>
                    {
                        text.Span("Issue Date: ").SemiBold();
                        text.Span(issueDate.ToString("d"));
                    });
                });

                var currentDir = Directory.GetCurrentDirectory();
                var baseDir = AppDomain.CurrentDomain.BaseDirectory;
                
                var possiblePaths = new[]
                {
                    Path.Combine(currentDir, "..", "Infrastructure", "Assets", "logo.png"),
                    Path.Combine(currentDir, "Infrastructure", "Assets", "logo.png"),
                    Path.Combine(baseDir, "..", "..", "..", "..", "Infrastructure", "Assets", "logo.png"),
                    @"c:\Users\DELL\Desktop\GOUTHAM\backend\Infrastructure\Assets\logo.png"
                };

                var actualLogoPath = possiblePaths.FirstOrDefault(System.IO.File.Exists);

                if (actualLogoPath != null)
                {
                    row.ConstantItem(100).Height(50).Image(actualLogoPath);
                }
                else
                {
                    row.ConstantItem(100).Height(50).Placeholder(); // Optional: Logo Placeholder
                }
            });
        }

        private void ComposeCustomerDetails(ColumnDescriptor column, User customer)
        {
            column.Item().Text("Customer Details").FontSize(14).SemiBold().FontColor(Colors.Grey.Darken3);
            column.Item().PaddingTop(5).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(3);
                });

                table.Cell().Text("Name:");
                table.Cell().Text($"{customer.FirstName} {customer.LastName}");

                table.Cell().Text("Email:");
                table.Cell().Text(customer.Email);

                if (!string.IsNullOrEmpty(customer.Phone))
                {
                    table.Cell().Text("Phone:");
                    table.Cell().Text(customer.Phone);
                }
            });
        }

        private void ComposePolicyDetails(IContainer container, Policy policy)
        {
            var plan = policy.Plan;
            var durationMonths = policy.DurationInMonths;
            var planDefaultMonths = plan?.DurationInMonths ?? durationMonths;

            // Always use the frozen snapshot values – never trust live Plan values
            var baseCoverage  = policy.PlanBaseCoverageAmount;
            var basePremium   = policy.PlanBasePremiumAmount;
            var yourCoverage  = policy.CoverageAmount;

            container.Column(column =>
            {
                column.Item().Text("Policy & Plan Details").FontSize(14).SemiBold().FontColor(Colors.Grey.Darken3);

                // General plan / policy info
                column.Item().PaddingTop(5).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(1);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(1);
                        columns.RelativeColumn(2);
                    });

                    table.Cell().Element(CellStyle).Text("Plan Name:");
                    table.Cell().Element(CellStyle).Text(plan?.Name ?? "N/A").SemiBold();

                    table.Cell().Element(CellStyle).Text("Base Coverage:");
                    table.Cell().Element(CellStyle).Text($"${baseCoverage:N2} (for {planDefaultMonths} months)");

                    table.Cell().Element(CellStyle).Text("Your Coverage:");
                    table.Cell().Element(CellStyle).Text($"${yourCoverage:N2}").SemiBold();

                    table.Cell().Element(CellStyle).Text("Duration:");
                    table.Cell().Element(CellStyle).Text($"{durationMonths} Months");

                    table.Cell().Element(CellStyle).Text("Start Date:");
                    table.Cell().Element(CellStyle).Text(policy.StartDate.ToString("d"));

                    table.Cell().Element(CellStyle).Text("End Date:");
                    table.Cell().Element(CellStyle).Text(policy.EndDate.ToString("d"));
                });

                // Financial summary
                column.Item().PaddingTop(15).Text("Financial Summary").FontSize(12).SemiBold().FontColor(Colors.Grey.Darken2);
                column.Item().PaddingTop(5).Table(table =>
                {
                    SetupTableColumns(table);
                    DrawTableHeader(table, "Base Premium", "Payment Freq.", "Total Premium", "Status");

                    table.Cell().Element(CellStyle).Text($"${basePremium:N2}/month");
                    table.Cell().Element(CellStyle).Text(policy.PaymentFrequency.ToString());
                    table.Cell().Element(CellStyle).Text($"${policy.TotalPremium:N2}").SemiBold();
                    table.Cell().Element(CellStyle).Text(policy.Status.ToString());
                });
            });
        }

        private void ComposeClaimDetails(IContainer container, Claim claim)
        {
            container.Column(column =>
            {
                column.Item().Text("Claim Details").FontSize(14).SemiBold().FontColor(Colors.Grey.Darken3);
                column.Item().PaddingTop(5).Table(table =>
                {
                    SetupTableColumns(table);
                    DrawTableHeader(table, "Claim Amount", "Status", "Reason", "Approved Amount");

                    table.Cell().Element(CellStyle).Text($"${claim.ClaimAmount}");
                    table.Cell().Element(CellStyle).Text(claim.Status.ToString());
                    table.Cell().Element(CellStyle).Text(claim.Reason);
                    table.Cell().Element(CellStyle).Text(claim.ApprovedAmount.HasValue ? $"${claim.ApprovedAmount}" : "N/A");
                });
            });
        }

        private void ComposePaymentDetails(IContainer container, PolicyPayment payment)
        {
            container.Column(column =>
            {
                column.Item().Text("Payment Details").FontSize(14).SemiBold().FontColor(Colors.Grey.Darken3);
                column.Item().PaddingTop(5).Table(table =>
                {
                    SetupTableColumns(table);
                    DrawTableHeader(table, "Amount", "Status", "Due Date", "Paid Date");

                    table.Cell().Element(CellStyle).Text($"${payment.Amount}");
                    table.Cell().Element(CellStyle).Text(payment.Status.ToString());
                    table.Cell().Element(CellStyle).Text(payment.DueDate.ToString("d"));
                    table.Cell().Element(CellStyle).Text(payment.PaidDate?.ToString("d") ?? "N/A");
                });
            });
        }

        private void SetupTableColumns(TableDescriptor table)
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn();
                columns.RelativeColumn();
                columns.RelativeColumn();
                columns.RelativeColumn();
            });
        }

        private void DrawTableHeader(TableDescriptor table, params string[] headers)
        {
            foreach (var header in headers)
            {
                table.Cell().Element(HeaderStyle).Text(header);
            }

            IContainer HeaderStyle(IContainer container)
            {
                return container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
            }
        }

        private IContainer CellStyle(IContainer container)
        {
            return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5);
        }

        private void ComposeFooter(IContainer container)
        {
            container.AlignCenter().Text(x =>
            {
                x.Span("Page ");
                x.CurrentPageNumber();
                x.Span(" of ");
                x.TotalPages();
            });
        }
    }
}
