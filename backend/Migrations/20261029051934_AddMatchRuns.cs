using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobBank.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMatchRuns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MatchRuns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RunAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsManual = table.Column<bool>(type: "bit", nullable: false),
                    CandidateCount = table.Column<int>(type: "int", nullable: false),
                    VacancyCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchRuns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MatchResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MatchRunId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JobSeekerProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CandidateRefNo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CandidateName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CandidateMobile = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    JobPostId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JobTitle = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CompanyName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Score = table.Column<int>(type: "int", nullable: false),
                    Reasons = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatchResults_MatchRuns_MatchRunId",
                        column: x => x.MatchRunId,
                        principalTable: "MatchRuns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MatchResults_MatchRunId",
                table: "MatchResults",
                column: "MatchRunId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MatchResults");

            migrationBuilder.DropTable(
                name: "MatchRuns");
        }
    }
}
