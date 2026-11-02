using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobBank.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNicNumberToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NicNumber",
                table: "Users",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

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

            migrationBuilder.DropColumn(
                name: "NicNumber",
                table: "Users");
        }
    }
}
