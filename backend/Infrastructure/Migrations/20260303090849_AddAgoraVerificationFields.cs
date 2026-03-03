using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAgoraVerificationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsVideoVerified",
                table: "Claims",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "VerificationNotes",
                table: "Claims",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VerificationRoomId",
                table: "Claims",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "VerificationScheduledDate",
                table: "Claims",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsVideoVerified",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "VerificationNotes",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "VerificationRoomId",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "VerificationScheduledDate",
                table: "Claims");
        }
    }
}
