using System;
using System.Text.Json.Serialization;

namespace JobBank.Api.Models
{
    public enum UserRole
    {
        Admin,
        Employer,
        JobSeeker
    }

    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Email { get; set; } = string.Empty;
        public string NicNumber { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public UserRole Role { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public CompanyProfile? CompanyProfile { get; set; }
        public JobSeekerProfile? JobSeekerProfile { get; set; }
    }
}
