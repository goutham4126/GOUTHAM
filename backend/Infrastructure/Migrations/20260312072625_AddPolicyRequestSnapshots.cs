using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPolicyRequestSnapshots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "BasePremiumAmount",
                table: "PolicyRequests",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "CoverageAmount",
                table: "PolicyRequests",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "FinalPremiumAmount",
                table: "PolicyRequests",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "PlanDescription",
                table: "PolicyRequests",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PlanType",
                table: "PolicyRequests",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BasePremiumAmount",
                table: "PolicyRequests");

            migrationBuilder.DropColumn(
                name: "CoverageAmount",
                table: "PolicyRequests");

            migrationBuilder.DropColumn(
                name: "FinalPremiumAmount",
                table: "PolicyRequests");

            migrationBuilder.DropColumn(
                name: "PlanDescription",
                table: "PolicyRequests");

            migrationBuilder.DropColumn(
                name: "PlanType",
                table: "PolicyRequests");
        }
    }
}
