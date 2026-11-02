using System;
using System.Text.Json.Serialization;

namespace JobBank.Api.Models
{
    public enum ApplicationStatus
    {
        Applied,
        Reviewing,
        Shortlisted,
        Accepted,
        Rejected
    }

    public class JobApplication
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid JobPostId { get; set; }
        public JobPost? JobPost { get; set; }

        public Guid JobSeekerProfileId { get; set; }
        public JobSeekerProfile? JobSeekerProfile { get; set; }

        public string ResumeUrl { get; set; } = string.Empty; // Custom resume or default from profile
        public string CoverLetter { get; set; } = string.Empty;

        [JsonConverter(typeof(JsonStringEnumConverter))]
        public ApplicationStatus Status { get; set; } = ApplicationStatus.Applied;

        // Reason given by the company when rejecting; cleared on any other status
        public string RejectionRemark { get; set; } = string.Empty;
        public DateTime AppliedAt { get; set; } = DateTime.UtcNow;
    }
}
