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

            if (string.IsNullOrWhiteSpace(dto.JobCategory))
            {
                return BadRequest(new { Message = "Job category is required." });
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
                JobType = job.JobType,
                IsActive = job.IsActive,
                CreatedAt = job.CreatedAt
            });
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

            job.Title = dto.Title.Trim();
            job.Description = dto.Description.Trim();
            if (string.IsNullOrWhiteSpace(dto.JobCategory))
            {
                return BadRequest(new { Message = "Job category is required." });
            }

            job.Requirements = dto.Requirements.Trim();
            job.JobCategory = dto.JobCategory.Trim();
            job.Location = dto.Location.Trim();
            job.SalaryRange = dto.SalaryRange.Trim();
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
