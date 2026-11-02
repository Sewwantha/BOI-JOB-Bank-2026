using System;
using JobBank.Api.Models;

namespace JobBank.Api.DTOs.Admin
{
    public class AdminRegisterUserDto
    {
        // Account credentials
        public UserRole Role { get; set; }
        public string Email { get; set; } = string.Empty;
        public string NicNumber { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;

        // Employer (company) details
        public string CompanyName { get; set; } = string.Empty;
        public string CompanyDescription { get; set; } = string.Empty;
        public string Website { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;

        // Job Seeker personal information
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string DateOfBirth { get; set; } = string.Empty;
        public string MobileNumber { get; set; } = string.Empty;
        public string LandlineNumber { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;

        // Job Seeker contact information
        public string Address { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string PreferredZone { get; set; } = string.Empty;

        // Vacancy the IR officer assigns at registration; null sends the candidate to the candidate pool
        public Guid? JobPostId { get; set; }

        // Job Seeker education, experience & preferences
        public string EducationalQualifications { get; set; } = string.Empty;
        public string VocationalTraining { get; set; } = string.Empty;
        public string Experience { get; set; } = string.Empty;
        public string Skills { get; set; } = string.Empty;
        public string PreferredJobCategories { get; set; } = string.Empty;
    }
}
