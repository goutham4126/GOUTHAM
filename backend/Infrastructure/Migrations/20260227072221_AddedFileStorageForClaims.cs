using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddedFileStorageForClaims : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AgentId",
                table: "Policies",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Reason",
                table: "Claims",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "BlockchainTxHash",
                table: "Claims",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ClaimOfficerId",
                table: "Claims",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocumentHash",
                table: "Claims",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocumentUrl",
                table: "Claims",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Policies_AgentId",
                table: "Policies",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_Claims_ClaimOfficerId",
                table: "Claims",
                column: "ClaimOfficerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Claims_Users_ClaimOfficerId",
                table: "Claims",
                column: "ClaimOfficerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Policies_Users_AgentId",
                table: "Policies",
                column: "AgentId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Claims_Users_ClaimOfficerId",
                table: "Claims");

            migrationBuilder.DropForeignKey(
                name: "FK_Policies_Users_AgentId",
                table: "Policies");

            migrationBuilder.DropIndex(
                name: "IX_Policies_AgentId",
                table: "Policies");

            migrationBuilder.DropIndex(
                name: "IX_Claims_ClaimOfficerId",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "AgentId",
                table: "Policies");

            migrationBuilder.DropColumn(
                name: "BlockchainTxHash",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "ClaimOfficerId",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "DocumentHash",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "DocumentUrl",
                table: "Claims");

            migrationBuilder.AlterColumn<string>(
                name: "Reason",
                table: "Claims",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000);
        }
    }
}
