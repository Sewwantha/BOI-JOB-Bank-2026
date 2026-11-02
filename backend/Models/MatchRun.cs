using System;
using System.Collections.Generic;

namespace JobBank.Api.Models
{
    // One weekly analysis of the candidate pool against active job vacancies
    public class MatchRun
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public DateTime RunAt { get; set; } = DateTime.UtcNow;
        public bool IsManual { get; set; }
        public int CandidateCount { get; set; }
        public int VacancyCount { get; set; }

        public ICollection<MatchResult> Results { get; set; } = new List<MatchResult>();
    }

    // Snapshot of a candidate/vacancy pair as it was at run time; no FKs to the profile or job
    // so deleting either later does not break the report
    public class MatchResult
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid MatchRunId { get; set; }
        public MatchRun? MatchRun { get; set; }

        public Guid JobSeekerProfileId { get; set; }
        public string CandidateRefNo { get; set; } = string.Empty;
        public string CandidateName { get; set; } = string.Empty;
        public string CandidateMobile { get; set; } = string.Empty;

        public Guid JobPostId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;

        public int Score { get; set; }
        public string Reasons { get; set; } = string.Empty; // "; " separated
    }
}
