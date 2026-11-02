using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobBank.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRefNoToJobSeekerProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RefNo",
                table: "JobSeekerProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RefNo",
                table: "JobSeekerProfiles");
        }
    }
}
