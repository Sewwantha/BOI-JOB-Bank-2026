using System;

namespace JobBank.Api.DTOs.Application
{
    public class JobApplicationCreateDto
    {
        public Guid JobPostId { get; set; }
        public string ResumeUrl { get; set; } = string.Empty;
        public string CoverLetter { get; set; } = string.Empty;
    }
}
