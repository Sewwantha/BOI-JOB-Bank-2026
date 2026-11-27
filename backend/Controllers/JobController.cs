using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobBank.Api.Data;
using JobBank.Api.DTOs.Job;
using JobBank.Api.Models;

namespace JobBank.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JobController : ControllerBase
    {
        private readonly JobBankDbContext _context;

        public JobController(JobBankDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetJobs(
            [FromQuery] string? search,
            [FromQuery] string? location,
            [FromQuery] JobType? type)
        {
            var query = _context.JobPosts
                .Include(j => j.CompanyProfile)
                .Where(j => j.IsActive)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(j => j.Title.ToLower().Contains(term) ||
                                         j.Description.ToLower().Contains(term) ||
                                         j.Requirements.ToLower().Contains(term) ||
                                         j.CompanyProfile!.CompanyName.ToLower().Contains(term));
            }

            if (!string.IsNullOrEmpty(location))
            {
                var loc = location.Trim().ToLower();
                query = query.Where(j => j.Location.ToLower().Contains(loc));
            }

            if (type.HasValue)
            {
                query = query.Where(j => j.JobType == type.Value);
            }

            var jobs = query
                .OrderByDescending(j => j.CreatedAt)
                .Select(j => new JobPostDto
                {
                    Id = j.Id,
                    CompanyProfileId = j.CompanyProfileId,
                    CompanyName = j.CompanyProfile!.CompanyName,
                    CompanyLogoUrl = j.CompanyProfile!.LogoUrl,
                    Title = j.Title,
                    Description = j.Description,
                    Requirements = j.Requirements,
                    JobCategory = j.JobCategory,
                    Location = j.Location,
                    SalaryRange = j.SalaryRange,
                    PositionsAvailable = j.PositionsAvailable,
                    FilledPositions = j.Applications.Count(a => a.Status == ApplicationStatus.Accepted),
                    JobType = j.JobType,
                    IsActive = j.IsActive,
                    CreatedAt = j.CreatedAt
                })
                .ToList();

            return Ok(jobs);
        }

        [HttpGet("{id}")]
        public IActionResult GetJob(Guid id)
        {
            var j = _context.JobPosts
                .Include(j => j.CompanyProfile)
                .FirstOrDefault(j => j.Id == id);

            if (j == null)
            {
                return NotFound(new { Message = "Job post not found." });
            }

            return Ok(new JobPostDto
            {
                Id = j.Id,
                CompanyProfileId = j.CompanyProfileId,
                CompanyName = j.CompanyProfile!.CompanyName,
                CompanyLogoUrl = j.CompanyProfile!.LogoUrl,
                Title = j.Title,
                Description = j.Description,
                Requirements = j.Requirements,
                JobCategory = j.JobCategory,
                Location = j.Location,
                SalaryRange = j.SalaryRange,
                PositionsAvailable = j.PositionsAvailable,
                FilledPositions = _context.JobApplications.Count(a => a.JobPostId == j.Id && a.Status == ApplicationStatus.Accepted),
                    JobType = j.JobType,
                IsActive = j.IsActive,
                CreatedAt = j.CreatedAt
            });
        }

        [Authorize(Roles = "Employer")]
        [HttpGet("employer")]
        public IActionResult GetEmployerJobs()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
            {
                return Unauthorized(new { Message = "Invalid user token." });
            }

            var company = _context.CompanyProfiles.FirstOrDefault(c => c.UserId == userId);
            if (company == null)
            {
                return NotFound(new { Message = "Company profile not found." });
            }

            var jobs = _context.JobPosts
                .Where(j => j.CompanyProfileId == company.Id)
                .OrderByDescending(j => j.CreatedAt)
                .Select(j => new JobPostDto
                {
                    Id = j.Id,
                    CompanyProfileId = j.CompanyProfileId,
                    CompanyName = company.CompanyName,
                    CompanyLogoUrl = company.LogoUrl,
                    Title = j.Title,
                    Description = j.Description,
                    Requirements = j.Requirements,
                    JobCategory = j.JobCategory,
                    Location = j.Location,
                    SalaryRange = j.SalaryRange,
                    PositionsAvailable = j.PositionsAvailable,
                    FilledPositions = j.Applications.Count(a => a.Status == ApplicationStatus.Accepted),
                    JobType = j.JobType,
                    IsActive = j.IsActive,
                    CreatedAt = j.CreatedAt
                })
                .ToList();

            return Ok(jobs);
        }

        [Authorize(Roles = "Employer")]
        [HttpPost]
        public IActionResult CreateJob([FromBody] JobPostCreateDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
            {
                return Unauthorized(new { Message = "Invalid user token." });
            }

            var company = _context.CompanyProfiles.FirstOrDefault(c => c.UserId == userId);
            if (company == null)
            {
                return NotFound(new { Message = "Company profile not found. Please set up your company profile first." });
            }

            var validationError = ValidateMandatoryFields(dto);
            if (validationError != null)
            {
                return BadRequest(new { Message = validationError });
            }

            var job = new JobPost
            {
                CompanyProfileId = company.Id,
                Title = dto.Title.Trim(),
                Description = dto.Description.Trim(),
                Requirements = dto.Requirements.Trim(),
                JobCategory = dto.JobCategory.Trim(),
                Location = dto.Location.Trim(),
                SalaryRange = dto.SalaryRange.Trim(),
                PositionsAvailable = dto.PositionsAvailable > 0 ? dto.PositionsAvailable : 1,
                JobType = dto.JobType,
                IsActive = true
            };

            _context.JobPosts.Add(job);
            _context.SaveChanges();

            return CreatedAtAction(nameof(GetJob), new { id = job.Id }, new JobPostDto
            {
                Id = job.Id,
                CompanyProfileId = job.CompanyProfileId,
                CompanyName = company.CompanyName,
                CompanyLogoUrl = company.LogoUrl,
                Title = job.Title,
                Description = job.Description,
                Requirements = job.Requirements,
                JobCategory = job.JobCategory,
                Location = job.Location,
                SalaryRange = job.SalaryRange,
                PositionsAvailable = job.PositionsAvailable,
                JobType = job.JobType,
                IsActive = job.IsActive,
                CreatedAt = job.CreatedAt
            });
        }

        // Job Title, Job Category, Job Type, Salary Range and Location are mandatory for a job post.
        private static string? ValidateMandatoryFields(JobPostCreateDto dto)
        {
            var missing = new List<string>();
            if (string.IsNullOrWhiteSpace(dto.Title)) missing.Add("Job Title");
            if (string.IsNullOrWhiteSpace(dto.JobCategory)) missing.Add("Job Category");
            if (!Enum.IsDefined(typeof(JobType), dto.JobType)) missing.Add("Job Type");
            if (string.IsNullOrWhiteSpace(dto.SalaryRange)) missing.Add("Salary Range");
            if (string.IsNullOrWhiteSpace(dto.Location)) missing.Add("Location");

            return missing.Count > 0
                ? $"Please fill in the mandatory field(s): {string.Join(", ", missing)}."
                : null;
        }

        public const int MaxBulkJobs = 200;

        // Creates many vacancies in one request (bulk CSV upload). All-or-nothing:
        // if any row is invalid, nothing is saved and the row errors are returned.
        [Authorize(Roles = "Employer")]
        [HttpPost("bulk")]
        public IActionResult CreateJobsBulk([FromBody] List<JobPostCreateDto> dtos)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
            {
                return Unauthorized(new { Message = "Invalid user token." });
            }

            var company = _context.CompanyProfiles.FirstOrDefault(c => c.UserId == userId);
            if (company == null)
            {
                return NotFound(new { Message = "Company profile not found. Please set up your company profile first." });
            }

            if (dtos == null || dtos.Count == 0)
            {
                return BadRequest(new { Message = "No vacancies were provided." });
            }
            if (dtos.Count > MaxBulkJobs)
            {
                return BadRequest(new { Message = $"You can upload at most {MaxBulkJobs} vacancies at a time." });
            }

            var errors = new List<string>();
            for (int i = 0; i < dtos.Count; i++)
            {
                var d = dtos[i];
                var missing = new List<string>();
                if (string.IsNullOrWhiteSpace(d.Title)) missing.Add("Title");
                if (string.IsNullOrWhiteSpace(d.JobCategory)) missing.Add("Job Category");
                if (string.IsNullOrWhiteSpace(d.Location)) missing.Add("Location");
                if (string.IsNullOrWhiteSpace(d.SalaryRange)) missing.Add("Salary Range");
                if (string.IsNullOrWhiteSpace(d.Description)) missing.Add("Description");
                if (string.IsNullOrWhiteSpace(d.Requirements)) missing.Add("Requirements");
                if (!Enum.IsDefined(typeof(JobType), d.JobType)) missing.Add("valid Job Type");
                if (missing.Count > 0) errors.Add($"Vacancy {i + 1}: missing {string.Join(", ", missing)}.");
            }
            if (errors.Count > 0)
            {
                return BadRequest(new { Message = "Some vacancies are invalid. Nothing was saved.", Errors = errors });
            }

            var now = DateTime.UtcNow;
            var jobs = dtos.Select(d => new JobPost
            {
                CompanyProfileId = company.Id,
                Title = d.Title.Trim(),
                Description = d.Description.Trim(),
                Requirements = d.Requirements.Trim(),
                JobCategory = d.JobCategory.Trim(),
                Location = d.Location.Trim(),
                SalaryRange = d.SalaryRange.Trim(),
                PositionsAvailable = d.PositionsAvailable > 0 ? d.PositionsAvailable : 1,
                JobType = d.JobType,
                IsActive = true,
                CreatedAt = now
            }).ToList();

            _context.JobPosts.AddRange(jobs);
            _context.SaveChanges();

            return Ok(new { Message = $"{jobs.Count} vacancies posted successfully.", Count = jobs.Count });
        }

        [Authorize(Roles = "Employer")]
        [HttpPut("{id}")]
        public IActionResult UpdateJob(Guid id, [FromBody] JobPostCreateDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
            {
                return Unauthorized(new { Message = "Invalid user token." });
            }

            var company = _context.CompanyProfiles.FirstOrDefault(c => c.UserId == userId);
            if (company == null)
            {
                return NotFound(new { Message = "Company profile not found." });
            }

            var job = _context.JobPosts.FirstOrDefault(j => j.Id == id && j.CompanyProfileId == company.Id);
            if (job == null)
            {
                return NotFound(new { Message = "Job post not found or unauthorized to edit." });
            }

            var validationError = ValidateMandatoryFields(dto);
            if (validationError != null)
            {
                return BadRequest(new { Message = validationError });
            }

            // Positions cannot go below the number of applicants already selected
            var filledPositions = _context.JobApplications.Count(a => a.JobPostId == job.Id && a.Status == ApplicationStatus.Accepted);
            if (dto.PositionsAvailable < filledPositions)
            {
                return BadRequest(new { Message = $"{filledPositions} applicant(s) are already selected for this job, so available positions cannot be less than {filledPositions}." });
            }

            job.Title = dto.Title.Trim();
            job.Description = dto.Description.Trim();
            job.Requirements = dto.Requirements.Trim();
            job.JobCategory = dto.JobCategory.Trim();
            job.Location = dto.Location.Trim();
            job.SalaryRange = dto.SalaryRange.Trim();
            job.PositionsAvailable = dto.PositionsAvailable > 0 ? dto.PositionsAvailable : 1;
            job.JobType = dto.JobType;

            _context.SaveChanges();

            return Ok(new JobPostDto
            {
                Id = job.Id,
                CompanyProfileId = job.CompanyProfileId,
                CompanyName = company.CompanyName,
                CompanyLogoUrl = company.LogoUrl,
                Title = job.Title,
                Description = job.Description,
                Requirements = job.Requirements,
                JobCategory = job.JobCategory,
                Location = job.Location,
                SalaryRange = job.SalaryRange,
                PositionsAvailable = job.PositionsAvailable,
                FilledPositions = _context.JobApplications.Count(a => a.JobPostId == job.Id && a.Status == ApplicationStatus.Accepted),
                JobType = job.JobType,
                IsActive = job.IsActive,
                CreatedAt = job.CreatedAt
            });
        }

        [Authorize(Roles = "Employer")]
        [HttpDelete("{id}")]
        public IActionResult DeleteJob(Guid id)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
            {
                return Unauthorized(new { Message = "Invalid user token." });
            }

            var company = _context.CompanyProfiles.FirstOrDefault(c => c.UserId == userId);
            if (company == null)
            {
                return NotFound(new { Message = "Company profile not found." });
            }

            var job = _context.JobPosts.FirstOrDefault(j => j.Id == id && j.CompanyProfileId == company.Id);
            if (job == null)
            {
                return NotFound(new { Message = "Job post not found or unauthorized to delete." });
            }

            _context.JobPosts.Remove(job);
            _context.SaveChanges();

            return Ok(new { Message = "Job post deleted successfully." });
        }
    }
}
