using System;
using JobBank.Api.Models;

namespace JobBank.Api.DTOs.Application
{
    public class JobApplicationDto
    {
        public Guid Id { get; set; }
        public Guid JobPostId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        
        public Guid JobSeekerProfileId { get; set; }
        public string SeekerName { get; set; } = string.Empty;
        public string SeekerEmail { get; set; } = string.Empty;
        
        public string ResumeUrl { get; set; } = string.Empty;
        public string CoverLetter { get; set; } = string.Empty;
        public ApplicationStatus Status { get; set; }
        public string RejectionRemark { get; set; } = string.Empty;
        public DateTime AppliedAt { get; set; }

        // Extra details for shortlisting
        public string SeekerPhone { get; set; } = string.Empty;
        public string SeekerAddress { get; set; } = string.Empty;
        public string SeekerSkills { get; set; } = string.Empty;
        public string SeekerEducation { get; set; } = string.Empty;
        public string SeekerVocationalTraining { get; set; } = string.Empty;
        public string SeekerExperience { get; set; } = string.Empty;
    }
}
