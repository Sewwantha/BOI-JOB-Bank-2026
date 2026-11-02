namespace JobBank.Api.DTOs.Admin
{
    public class AdminStatsDto
    {
        public int TotalUsers { get; set; }
        public int TotalEmployers { get; set; }
        public int TotalJobSeekers { get; set; }
        public int TotalJobPosts { get; set; }
        public int ActiveJobPosts { get; set; }
        public int TotalApplications { get; set; }
    }
}
