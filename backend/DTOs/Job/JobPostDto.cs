using System;
using JobBank.Api.Models;

namespace JobBank.Api.DTOs.Job
{
    public class JobPostDto
    {
        public Guid Id { get; set; }
        public Guid CompanyProfileId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string CompanyLogoUrl { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Requirements { get; set; } = string.Empty;
        public string JobCategory { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string SalaryRange { get; set; } = string.Empty;
        public int PositionsAvailable { get; set; } = 1;  // total openings set by the employer
        public int FilledPositions { get; set; }           // applicants the employer selected (Accepted)
        public int RemainingPositions => Math.Max(PositionsAvailable - FilledPositions, 0);
        public JobType JobType { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
