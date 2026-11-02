using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobBank.Api.Data;
using JobBank.Api.DTOs.Application;
using JobBank.Api.Models;

namespace JobBank.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ApplicationController : ControllerBase
    {
        private readonly JobBankDbContext _context;

        public ApplicationController(JobBankDbContext context)
        {
            _context = context;
        }

        [Authorize(Roles = "JobSeeker")]
        [HttpPost]
        public IActionResult Apply([FromBody] JobApplicationCreateDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
            {
                return Unauthorized(new { Message = "Invalid user token." });
            }

            var seeker = _context.JobSeekerProfiles.FirstOrDefault(s => s.UserId == userId);
            if (seeker == null)
            {
                return NotFound(new { Message = "Job seeker profile not found. Please complete your profile first." });
            }

            var job = _context.JobPosts.FirstOrDefault(j => j.Id == dto.JobPostId && j.IsActive);
            if (job == null)
            {
                return NotFound(new { Message = "Job post not found or is no longer active." });
            }

            // Check duplicate application
            var existingApp = _context.JobApplications
                .FirstOrDefault(a => a.JobPostId == dto.JobPostId && a.JobSeekerProfileId == seeker.Id);

            if (existingApp != null)
            {
                return BadRequest(new { Message = "You have already applied for this job." });
            }

            var application = new JobApplication
            {
                JobPostId = dto.JobPostId,
                JobSeekerProfileId = seeker.Id,
                ResumeUrl = string.IsNullOrWhiteSpace(dto.ResumeUrl) ? seeker.ResumeUrl : dto.ResumeUrl.Trim(),
                CoverLetter = dto.CoverLetter.Trim(),
                Status = ApplicationStatus.Applied
            };

            _context.JobApplications.Add(application);
            _context.SaveChanges();

            return Ok(new { Message = "Application submitted successfully.", ApplicationId = application.Id });
        }

        [Authorize(Roles = "JobSeeker")]
        [HttpGet("seeker")]
        public IActionResult GetSeekerApplications()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
            {
                return Unauthorized(new { Message = "Invalid user token." });
            }

            var seeker = _context.JobSeekerProfiles.FirstOrDefault(s => s.UserId == userId);
            if (seeker == null)
            {
                return NotFound(new { Message = "Job seeker profile not found." });
            }

            var apps = _context.JobApplications
                .Include(a => a.JobPost)
                .ThenInclude(j => j!.CompanyProfile)
                .Where(a => a.JobSeekerProfileId == seeker.Id)
                .OrderByDescending(a => a.AppliedAt)
                .Select(a => new JobApplicationDto
                {
                    Id = a.Id,
                    JobPostId = a.JobPostId,
                    JobTitle = a.JobPost!.Title,
                    CompanyName = a.JobPost!.CompanyProfile!.CompanyName,
                    JobSeekerProfileId = a.JobSeekerProfileId,
                    SeekerName = $"{seeker.FirstName} {seeker.LastName}",
                    SeekerEmail = seeker.User!.Email,
                    ResumeUrl = a.ResumeUrl,
                    CoverLetter = a.CoverLetter,
                    Status = a.Status,
                    RejectionRemark = a.RejectionRemark,
                    AppliedAt = a.AppliedAt,
                    SeekerPhone = seeker.MobileNumber,
                    SeekerAddress = $"{seeker.Address}, {seeker.District}",
                    SeekerSkills = seeker.Skills,
                    SeekerEducation = seeker.EducationalQualifications,
                    SeekerVocationalTraining = seeker.VocationalTraining,
                    SeekerExperience = seeker.Experience
                })
                .ToList();

            return Ok(apps);
        }

        [Authorize(Roles = "Employer")]
        [HttpGet("job/{jobId}")]
        public IActionResult GetJobApplications(Guid jobId)
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

            var job = _context.JobPosts.FirstOrDefault(j => j.Id == jobId && j.CompanyProfileId == company.Id);
            if (job == null)
            {
                return NotFound(new { Message = "Job post not found or unauthorized." });
            }

            var apps = _context.JobApplications
                .Include(a => a.JobSeekerProfile)
                .ThenInclude(s => s!.User)
                .Where(a => a.JobPostId == jobId)
                .OrderByDescending(a => a.AppliedAt)
                .Select(a => new JobApplicationDto
                {
                    Id = a.Id,
                    JobPostId = a.JobPostId,
                    JobTitle = job.Title,
                    CompanyName = company.CompanyName,
                    JobSeekerProfileId = a.JobSeekerProfileId,
                    SeekerName = $"{a.JobSeekerProfile!.FirstName} {a.JobSeekerProfile.LastName}",
                    SeekerEmail = a.JobSeekerProfile.User!.Email,
                    ResumeUrl = a.ResumeUrl,
                    CoverLetter = a.CoverLetter,
                    Status = a.Status,
                    RejectionRemark = a.RejectionRemark,
                    AppliedAt = a.AppliedAt,
                    SeekerPhone = a.JobSeekerProfile!.MobileNumber,
                    SeekerAddress = $"{a.JobSeekerProfile.Address}, {a.JobSeekerProfile.District}",
                    SeekerSkills = a.JobSeekerProfile.Skills,
                    SeekerEducation = a.JobSeekerProfile.EducationalQualifications,
                    SeekerVocationalTraining = a.JobSeekerProfile.VocationalTraining,
                    SeekerExperience = a.JobSeekerProfile.Experience
                })
                .ToList();

            return Ok(apps);
        }

        [Authorize(Roles = "Employer")]
        [HttpGet("employer")]
        public IActionResult GetEmployerAllApplications()
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

            var apps = _context.JobApplications
                .Include(a => a.JobPost)
                .Include(a => a.JobSeekerProfile)
                .ThenInclude(s => s!.User)
                .Where(a => a.JobPost!.CompanyProfileId == company.Id)
                .OrderByDescending(a => a.AppliedAt)
                .Select(a => new JobApplicationDto
                {
                    Id = a.Id,
                    JobPostId = a.JobPostId,
                    JobTitle = a.JobPost!.Title,
                    CompanyName = company.CompanyName,
                    JobSeekerProfileId = a.JobSeekerProfileId,
                    SeekerName = $"{a.JobSeekerProfile!.FirstName} {a.JobSeekerProfile.LastName}",
                    SeekerEmail = a.JobSeekerProfile.User!.Email,
                    ResumeUrl = a.ResumeUrl,
                    CoverLetter = a.CoverLetter,
                    Status = a.Status,
                    RejectionRemark = a.RejectionRemark,
                    AppliedAt = a.AppliedAt,
                    SeekerPhone = a.JobSeekerProfile!.MobileNumber,
                    SeekerAddress = $"{a.JobSeekerProfile.Address}, {a.JobSeekerProfile.District}",
                    SeekerSkills = a.JobSeekerProfile.Skills,
                    SeekerEducation = a.JobSeekerProfile.EducationalQualifications,
                    SeekerVocationalTraining = a.JobSeekerProfile.VocationalTraining,
                    SeekerExperience = a.JobSeekerProfile.Experience
                })
                .ToList();

            return Ok(apps);
        }

        [Authorize(Roles = "Employer")]
        [HttpPut("{id}/status")]
        public IActionResult UpdateApplicationStatus(Guid id, [FromBody] JobApplicationStatusUpdateDto dto)
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

            var application = _context.JobApplications
                .Include(a => a.JobPost)
                .FirstOrDefault(a => a.Id == id && a.JobPost!.CompanyProfileId == company.Id);

            if (application == null)
            {
                return NotFound(new { Message = "Job application not found or unauthorized to review." });
            }

            var remark = (dto.RejectionRemark ?? string.Empty).Trim();
            if (dto.Status == ApplicationStatus.Rejected && string.IsNullOrEmpty(remark))
            {
                return BadRequest(new { Message = "A remark is required when rejecting an applicant." });
            }

            application.Status = dto.Status;
            application.RejectionRemark = dto.Status == ApplicationStatus.Rejected ? remark : string.Empty;
            _context.SaveChanges();

            return Ok(new { Message = "Application status updated successfully.", Status = application.Status, application.RejectionRemark });
        }
    }
}
