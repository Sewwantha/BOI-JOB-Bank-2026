using System;

namespace JobBank.Api.DTOs.Company
{
    public class CompanyProfileDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Website { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string LogoUrl { get; set; } = string.Empty;
    }
}
