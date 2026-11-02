using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobBank.Api.Migrations
{
    /// <inheritdoc />
    public partial class BackfillJobSeekerRefNo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "RefNo",
                table: "JobSeekerProfiles",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            // Give seekers registered before RefNo existed a number from their NIC and registration date
            // (same format as RefNoGenerator; CreatedAt is UTC so it is shifted to server local time).
            migrationBuilder.Sql(@"
WITH Src AS (
    SELECT p.Id, p.RefNo,
           COALESCE(NULLIF(p.NicNumber, ''), u.NicNumber, '') AS Nic,
           u.CreatedAt
    FROM JobSeekerProfiles p
    JOIN Users u ON u.Id = p.UserId
),
Based AS (
    SELECT Id, RefNo, CreatedAt,
           RIGHT('0000' + CASE
                              WHEN Nic = '' THEN ''
                              WHEN RIGHT(Nic, 1) LIKE '[0-9]' THEN RIGHT(Nic, 4)
                              ELSE RIGHT(LEFT(Nic, LEN(Nic) - 1), 4)
                          END, 4)
           + '-' + CONVERT(char(8), DATEADD(minute, DATEDIFF(minute, GETUTCDATE(), GETDATE()), CreatedAt), 112) AS BaseRefNo
    FROM Src
),
Numbered AS (
    SELECT Id, RefNo, BaseRefNo,
           ROW_NUMBER() OVER (PARTITION BY BaseRefNo
                              ORDER BY CASE WHEN RefNo <> '' THEN 0 ELSE 1 END, CreatedAt) AS Seq
    FROM Based
)
UPDATE p
SET RefNo = CASE WHEN n.Seq = 1 THEN n.BaseRefNo ELSE n.BaseRefNo + '-' + CAST(n.Seq AS varchar(10)) END
FROM JobSeekerProfiles p
JOIN Numbered n ON n.Id = p.Id
WHERE p.RefNo = '';");

            migrationBuilder.CreateIndex(
                name: "IX_JobSeekerProfiles_RefNo",
                table: "JobSeekerProfiles",
                column: "RefNo",
                unique: true,
                filter: "[RefNo] <> ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_JobSeekerProfiles_RefNo",
                table: "JobSeekerProfiles");

            migrationBuilder.AlterColumn<string>(
                name: "RefNo",
                table: "JobSeekerProfiles",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);
        }
    }
}
