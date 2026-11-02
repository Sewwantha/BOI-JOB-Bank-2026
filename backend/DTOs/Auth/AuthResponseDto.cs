using System;
using JobBank.Api.Models;

namespace JobBank.Api.DTOs.Auth
{
    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public Guid UserId { get; set; }
        public Guid? ProfileId { get; set; } // CompanyProfileId or JobSeekerProfileId if exists
        public string? RefNo { get; set; } // Job Seeker reference number, set on registration
        public string? UserName { get; set; } // Admin display name from UsrUser
        public string? LocationName { get; set; } // Admin location from the common database
    }
}
