using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobBank.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "JobSeekerProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DateOfBirth",
                table: "JobSeekerProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "District",
                table: "JobSeekerProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EducationalQualifications",
                table: "JobSeekerProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Gender",
                table: "JobSeekerProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LandlineNumber",
                table: "JobSeekerProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MobileNumber",
                table: "JobSeekerProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NicNumber",
                table: "JobSeekerProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PreferredJobCategories",
                table: "JobSeekerProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PreferredZone",
                table: "JobSeekerProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "VocationalTraining",
                table: "JobSeekerProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Address",
                table: "JobSeekerProfiles");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "JobSeekerProfiles");

            migrationBuilder.DropColumn(
                name: "District",
                table: "JobSeekerProfiles");

            migrationBuilder.DropColumn(
                name: "EducationalQualifications",
                table: "JobSeekerProfiles");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "JobSeekerProfiles");

            migrationBuilder.DropColumn(
                name: "LandlineNumber",
                table: "JobSeekerProfiles");

            migrationBuilder.DropColumn(
                name: "MobileNumber",
                table: "JobSeekerProfiles");

            migrationBuilder.DropColumn(
                name: "NicNumber",
                table: "JobSeekerProfiles");

            migrationBuilder.DropColumn(
                name: "PreferredJobCategories",
                table: "JobSeekerProfiles");

            migrationBuilder.DropColumn(
                name: "PreferredZone",
                table: "JobSeekerProfiles");

            migrationBuilder.DropColumn(
                name: "VocationalTraining",
                table: "JobSeekerProfiles");
        }
    }
}
