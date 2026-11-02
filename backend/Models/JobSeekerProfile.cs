using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace JobBank.Api.Models
{
    public class JobSeekerProfile
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        
        [JsonIgnore]
        public User? User { get; set; }

        // Reference number generated at registration: {last 4 NIC digits}-{yyyyMMdd}
        public string RefNo { get; set; } = string.Empty;

        // Personal Information
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string DateOfBirth { get; set; } = string.Empty;
        public string NicNumber { get; set; } = string.Empty;
        public string MobileNumber { get; set; } = string.Empty;
        public string LandlineNumber { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;

        // Contact Information
        public string Address { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string PreferredZone { get; set; } = string.Empty;

        // Education & Training
        public string EducationalQualifications { get; set; } = string.Empty;
        public string VocationalTraining { get; set; } = string.Empty;

        // Legacy / general fields
        public string Bio { get; set; } = string.Empty;
        public string ResumeUrl { get; set; } = string.Empty;
        public string Skills { get; set; } = string.Empty; // Comma separated list
        public string Experience { get; set; } = string.Empty;

        // Preferred Job Categories (comma separated)
        public string PreferredJobCategories { get; set; } = string.Empty;

        // Navigation properties
        [JsonIgnore]
        public ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();
    }
}
