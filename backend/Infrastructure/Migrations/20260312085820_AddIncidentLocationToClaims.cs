using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIncidentLocationToClaims : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "IncidentLatitude",
                table: "Claims",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "IncidentLongitude",
                table: "Claims",
                type: "float",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IncidentLatitude",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "IncidentLongitude",
                table: "Claims");
        }
    }
}
