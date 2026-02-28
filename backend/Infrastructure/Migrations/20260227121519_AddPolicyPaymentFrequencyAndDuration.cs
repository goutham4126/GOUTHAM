using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPolicyPaymentFrequencyAndDuration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DurationInMonths",
                table: "Policies",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "PaymentFrequency",
                table: "Policies",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Claim_ApprovedAmount",
                table: "Claims",
                sql: "[ApprovedAmount] <= [ClaimAmount]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Claim_ApprovedAmount",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "DurationInMonths",
                table: "Policies");

            migrationBuilder.DropColumn(
                name: "PaymentFrequency",
                table: "Policies");
        }
    }
}
