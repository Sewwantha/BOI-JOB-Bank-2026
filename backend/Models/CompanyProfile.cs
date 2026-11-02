using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace JobBank.Api.Models
{
    public class CompanyProfile
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        
        [JsonIgnore]
        public User? User { get; set; }

        public string CompanyName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Website { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string LogoUrl { get; set; } = string.Empty;

        // Navigation properties
        [JsonIgnore]
        public ICollection<JobPost> JobPosts { get; set; } = new List<JobPost>();
    }
}
