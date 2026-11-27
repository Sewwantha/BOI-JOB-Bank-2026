using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobBank.Api.Migrations
{
    /// <summary>Allows new-format 12-digit NIC numbers (old format is 9 digits + V/X).</summary>
    public partial class WidenNicNumberTo12 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_NicNumber",
                table: "Users");

            migrationBuilder.AlterColumn<string>(
                name: "NicNumber",
                table: "Users",
                type: "nvarchar(12)",
                maxLength: 12,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(10)",
                oldMaxLength: 10);

            migrationBuilder.CreateIndex(
                name: "IX_Users_NicNumber",
                table: "Users",
                column: "NicNumber",
                unique: true,
                filter: "[NicNumber] <> ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_NicNumber",
                table: "Users");

            migrationBuilder.AlterColumn<string>(
                name: "NicNumber",
                table: "Users",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(12)",
                oldMaxLength: 12);

            migrationBuilder.CreateIndex(
                name: "IX_Users_NicNumber",
                table: "Users",
                column: "NicNumber",
                unique: true,
                filter: "[NicNumber] <> ''");
        }
    }
}
