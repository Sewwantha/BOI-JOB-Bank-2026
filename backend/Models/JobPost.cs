using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace JobBank.Api.Models
{
    public enum JobType
    {
        FullTime = 0,
        Contract = 2,
        Internship = 4
    }

    public class JobPost
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CompanyProfileId { get; set; }
        public CompanyProfile? CompanyProfile { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Requirements { get; set; } = string.Empty;

        // Same values as JobSeekerProfile.PreferredJobCategories ("Other: ..." for custom); used for matching
        public string JobCategory { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string SalaryRange { get; set; } = string.Empty;

        [JsonConverter(typeof(JsonStringEnumConverter))]
        public JobType JobType { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [JsonIgnore]
        public ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();
    }
}
