using JobBank.Api.Models;

namespace JobBank.Api.DTOs.Job
{
    public class JobPostCreateDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Requirements { get; set; } = string.Empty;
        public string JobCategory { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string SalaryRange { get; set; } = string.Empty;
        public JobType JobType { get; set; }
    }
}
