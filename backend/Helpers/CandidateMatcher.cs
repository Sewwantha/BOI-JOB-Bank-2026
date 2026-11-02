using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using JobBank.Api.Data;
using JobBank.Api.Models;

namespace JobBank.Api.Helpers
{
    public static class CandidateMatcher
    {
        public static readonly TimeSpan Interval = TimeSpan.FromDays(7);

        // Scores every pool candidate (not yet accepted) against every active vacancy they are not
        // already assigned to. A pair needs a category or skill match; zone and district add points.
        // Categories are compared directly; jobs without a category fall back to searching the job text.
        public static MatchRun Run(JobBankDbContext context, bool isManual)
        {
            var candidates = context.JobSeekerProfiles
                .AsNoTracking()
                .Where(s => !s.Applications.Any(a => a.Status == ApplicationStatus.Accepted))
                .Select(s => new
                {
                    s.Id,
                    s.RefNo,
                    Name = (s.FirstName + " " + s.LastName).Trim(),
                    s.MobileNumber,
                    s.PreferredJobCategories,
                    s.Skills,
                    s.PreferredZone,
                    s.District,
                    AppliedJobIds = s.Applications.Select(a => a.JobPostId).ToList()
                })
                .ToList();

            var vacancies = context.JobPosts
                .AsNoTracking()
                .Where(j => j.IsActive && j.CompanyProfile != null)
                .Select(j => new
                {
                    j.Id,
                    j.Title,
                    j.Description,
                    j.Requirements,
                    j.JobCategory,
                    j.Location,
                    CompanyName = j.CompanyProfile!.CompanyName
                })
                .ToList();

            var run = new MatchRun
            {
                IsManual = isManual,
                CandidateCount = candidates.Count,
                VacancyCount = vacancies.Count
            };

            foreach (var job in vacancies)
            {
                var title = job.Title.ToLowerInvariant();
                var jobText = $"{job.Title} {job.Description} {job.Requirements}".ToLowerInvariant();
                var company = Normalize(job.CompanyName);
                var location = job.Location.ToLowerInvariant();
                var jobCategory = CategoryOf(job.JobCategory);

                foreach (var c in candidates)
                {
                    if (c.AppliedJobIds.Contains(job.Id)) continue;

                    var score = 0;
                    var reasons = new List<string>();

                    var category = CategoryOf(c.PreferredJobCategories);
                    if (category.Length > 0 && jobCategory.Length > 0)
                    {
                        if (category == jobCategory)
                        {
                            score += 40;
                            reasons.Add($"Category: {category}");
                        }
                    }
                    // Jobs posted before the category field existed: search the job text instead
                    else if (category.Length > 0)
                    {
                        if (jobText.Contains(category))
                        {
                            score += 40;
                            reasons.Add($"Category: {category}");
                        }
                        else if (category.Split(' ', StringSplitOptions.RemoveEmptyEntries).Any(w => w.Length >= 4 && title.Contains(w)))
                        {
                            score += 20;
                            reasons.Add($"Related category: {category}");
                        }
                    }

                    var matchedSkills = c.Skills
                        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                        .Select(s => s.ToLowerInvariant())
                        .Where(s => s.Length >= 2 && jobText.Contains(s))
                        .Distinct()
                        .ToList();
                    if (matchedSkills.Count > 0)
                    {
                        score += Math.Min(matchedSkills.Count * 10, 30);
                        reasons.Add($"Skills: {string.Join(", ", matchedSkills)}");
                    }

                    // Without a role match the pair is not a real match
                    if (score == 0) continue;

                    if (c.PreferredZone.Length > 0 && Normalize(c.PreferredZone) == company)
                    {
                        score += 20;
                        reasons.Add("Preferred zone");
                    }

                    if (c.District.Length > 0 && location.Contains(c.District.ToLowerInvariant()))
                    {
                        score += 10;
                        reasons.Add($"District: {c.District}");
                    }

                    run.Results.Add(new MatchResult
                    {
                        JobSeekerProfileId = c.Id,
                        CandidateRefNo = c.RefNo,
                        CandidateName = c.Name,
                        CandidateMobile = c.MobileNumber,
                        JobPostId = job.Id,
                        JobTitle = job.Title,
                        CompanyName = job.CompanyName,
                        Score = score,
                        Reasons = string.Join("; ", reasons)
                    });
                }
            }

            context.MatchRuns.Add(run);
            context.SaveChanges();
            return run;
        }

        // "Other: Welder" is stored for custom categories; match on the custom part
        private static string CategoryOf(string preferredJobCategories)
        {
            var category = preferredJobCategories.Trim();
            if (category.StartsWith("Other:", StringComparison.OrdinalIgnoreCase))
            {
                category = category["Other:".Length..].Trim();
            }
            return category.Equals("Other", StringComparison.OrdinalIgnoreCase) ? string.Empty : category.ToLowerInvariant();
        }

        private static string Normalize(string value) => value.Trim().ToUpperInvariant();
    }
}
