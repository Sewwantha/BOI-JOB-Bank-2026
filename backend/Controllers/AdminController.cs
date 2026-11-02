using System;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using JobBank.Api.Data;
using JobBank.Api.DTOs.Admin;
using JobBank.Api.DTOs.Job;
using JobBank.Api.DTOs.JobSeeker;
using JobBank.Api.Helpers;
using JobBank.Api.Models;

namespace JobBank.Api.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly JobBankDbContext _context;
        private readonly CommonDbService _commonDb;

        public AdminController(JobBankDbContext context, CommonDbService commonDb)
        {
            _context = context;
            _commonDb = commonDb;
        }

        // Available Job Locations (Zone) for the logged-in admin's location (project names from the common database)
        [HttpGet("zones")]
        public IActionResult GetZones()
        {
            var locationCode = User.FindFirst("locationCode")?.Value;
            if (string.IsNullOrWhiteSpace(locationCode))
            {
                return Ok(Array.Empty<string>());
            }

            // Only companies with open vacancies: matched by name, since project and CompanyProfile share no key
            var companiesWithVacancies = _context.JobPosts
                .Where(j => j.IsActive && j.CompanyProfile != null)
                .Select(j => j.CompanyProfile!.CompanyName)
                .Distinct()
                .AsEnumerable()
                .Select(name => name.Trim().ToUpper())
                .ToHashSet();

            try
            {
                var zones = _commonDb.GetZonesForLocation(locationCode)
                    .Where(name => companiesWithVacancies.Contains(name.Trim().ToUpper()))
                    .ToList();
                return Ok(zones);
            }
            catch (SqlException)
            {
                return StatusCode(503, new { Message = "Cannot connect to the zone database. Please try again later." });
            }
        }

        // Active job vacancies of the company selected as the preferred zone (matched by company name)
        [HttpGet("company-vacancies")]
        public IActionResult GetCompanyVacancies([FromQuery] string companyName)
        {
            if (string.IsNullOrWhiteSpace(companyName))
            {
                return Ok(Array.Empty<JobPostDto>());
            }

            var nameNormalized = companyName.Trim().ToUpper();
            var vacancies = _context.JobPosts
                .Include(j => j.CompanyProfile)
                .Where(j => j.IsActive && j.CompanyProfile != null && j.CompanyProfile.CompanyName.Trim().ToUpper() == nameNormalized)
                .OrderByDescending(j => j.CreatedAt)
                .Select(j => new JobPostDto
                {
                    Id = j.Id,
                    CompanyProfileId = j.CompanyProfileId,
                    CompanyName = j.CompanyProfile!.CompanyName,
                    CompanyLogoUrl = j.CompanyProfile.LogoUrl,
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

            return Ok(vacancies);
        }

        [HttpGet("stats")]
        public IActionResult GetStats()
        {
            var totalUsers = _context.Users.Count();
            var totalEmployers = _context.Users.Count(u => u.Role == UserRole.Employer);
            var totalJobSeekers = _context.Users.Count(u => u.Role == UserRole.JobSeeker);
            var totalJobPosts = _context.JobPosts.Count();
            var activeJobPosts = _context.JobPosts.Count(j => j.IsActive);
            var totalApplications = _context.JobApplications.Count();

            return Ok(new AdminStatsDto
            {
                TotalUsers = totalUsers,
                TotalEmployers = totalEmployers,
                TotalJobSeekers = totalJobSeekers,
                TotalJobPosts = totalJobPosts,
                ActiveJobPosts = activeJobPosts,
                TotalApplications = totalApplications
            });
        }

        [HttpGet("users")]
        public IActionResult GetUsers()
        {
            var users = _context.Users
                .Include(u => u.CompanyProfile)
                .Include(u => u.JobSeekerProfile)
                .OrderBy(u => u.CreatedAt)
                .Select(u => new
                {
                    u.Id,
                    u.Email,
                    u.Role,
                    u.CreatedAt,
                    ProfileName = u.Role == UserRole.Employer ? u.CompanyProfile!.CompanyName 
                                : u.Role == UserRole.JobSeeker ? $"{u.JobSeekerProfile!.FirstName} {u.JobSeekerProfile.LastName}" 
                                : "Administrator",
                    ProfileId = u.Role == UserRole.Employer ? (Guid?)u.CompanyProfile!.Id 
                               : u.Role == UserRole.JobSeeker ? (Guid?)u.JobSeekerProfile!.Id 
                               : null
                })
                .ToList();

            return Ok(users);
        }

        [HttpPost("users")]
        public IActionResult RegisterUser([FromBody] AdminRegisterUserDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
            {
                return BadRequest(new { Message = "Password must be at least 6 characters." });
            }

            if (dto.Role == UserRole.Admin)
            {
                return BadRequest(new { Message = "Admin accounts cannot be created from this panel." });
            }

            var user = new User
            {
                PasswordHash = PasswordHasher.Hash(dto.Password),
                Role = dto.Role
            };

            if (dto.Role == UserRole.JobSeeker)
            {
                var nicTrimmed = (dto.NicNumber ?? string.Empty).Trim();
                if (nicTrimmed.Length != 10)
                {
                    return BadRequest(new { Message = "NIC number must be exactly 10 characters." });
                }

                if (_context.Users.Any(u => u.NicNumber == nicTrimmed))
                {
                    return BadRequest(new { Message = "A user with this NIC number already exists." });
                }

                if (string.IsNullOrWhiteSpace(dto.FirstName))
                {
                    return BadRequest(new { Message = "Job seeker name is required." });
                }

                if (string.IsNullOrWhiteSpace(dto.MobileNumber))
                {
                    return BadRequest(new { Message = "Mobile number is required." });
                }

                if (dto.JobPostId.HasValue && !_context.JobPosts.Any(j => j.Id == dto.JobPostId && j.IsActive))
                {
                    return BadRequest(new { Message = "Selected job vacancy is no longer available." });
                }

                user.NicNumber = nicTrimmed;
                user.Email = nicTrimmed; // Same NIC-as-email convention as self-registration
            }
            else
            {
                if (string.IsNullOrWhiteSpace(dto.Email))
                {
                    return BadRequest(new { Message = "Email is required for Employers." });
                }

                var emailNormalized = dto.Email.Trim().ToLower();
                if (_context.Users.Any(u => u.Email.ToLower() == emailNormalized))
                {
                    return BadRequest(new { Message = "User with this email already exists." });
                }

                if (string.IsNullOrWhiteSpace(dto.CompanyName))
                {
                    return BadRequest(new { Message = "Company name is required." });
                }

                user.Email = dto.Email.Trim();
            }

            _context.Users.Add(user);

            Guid profileId;
            string? refNo = null;
            if (dto.Role == UserRole.Employer)
            {
                var company = new CompanyProfile
                {
                    UserId = user.Id,
                    CompanyName = dto.CompanyName.Trim(),
                    Description = string.IsNullOrWhiteSpace(dto.CompanyDescription)
                        ? "Update company description here."
                        : dto.CompanyDescription.Trim(),
                    Website = dto.Website.Trim(),
                    Location = dto.Location.Trim(),
                    LogoUrl = ""
                };
                _context.CompanyProfiles.Add(company);
                profileId = company.Id;
            }
            else
            {
                var seeker = new JobSeekerProfile
                {
                    UserId = user.Id,
                    RefNo = RefNoGenerator.Generate(_context, user.NicNumber),
                    FirstName = dto.FirstName.Trim(),
                    LastName = dto.LastName.Trim(),
                    DateOfBirth = dto.DateOfBirth,
                    NicNumber = user.NicNumber,
                    MobileNumber = dto.MobileNumber.Trim(),
                    LandlineNumber = dto.LandlineNumber.Trim(),
                    Gender = dto.Gender,
                    Address = dto.Address.Trim(),
                    District = dto.District,
                    PreferredZone = dto.PreferredZone,
                    EducationalQualifications = dto.EducationalQualifications,
                    VocationalTraining = dto.VocationalTraining,
                    Experience = dto.Experience,
                    Skills = dto.Skills.Trim(),
                    PreferredJobCategories = dto.PreferredJobCategories.Trim(),
                    Bio = "Update bio here.",
                    ResumeUrl = ""
                };
                _context.JobSeekerProfiles.Add(seeker);
                profileId = seeker.Id;
                refNo = seeker.RefNo;

                // Without an assigned vacancy the candidate goes to the candidate pool
                if (dto.JobPostId.HasValue)
                {
                    _context.JobApplications.Add(new JobApplication
                    {
                        JobPostId = dto.JobPostId.Value,
                        JobSeekerProfileId = seeker.Id,
                        ResumeUrl = seeker.ResumeUrl,
                        Status = ApplicationStatus.Applied
                    });
                }
            }

            // User, profile and application are saved together so a failure never leaves an orphan account
            _context.SaveChanges();

            return Ok(new
            {
                Message = dto.Role == UserRole.Employer
                    ? "Employer registered successfully."
                    : dto.JobPostId.HasValue
                        ? "Job seeker registered and assigned to the selected vacancy."
                        : "Job seeker registered and added to the candidate pool.",
                UserId = user.Id,
                ProfileId = profileId,
                RefNo = refNo
            });
        }

        [HttpGet("jobseekers")]
        public IActionResult GetJobSeekers()
        {
            var seekers = _context.JobSeekerProfiles
                .Include(s => s.User)
                .OrderByDescending(s => s.User!.CreatedAt)
                .Select(s => new
                {
                    s.Id,
                    s.UserId,
                    s.RefNo,
                    s.FirstName,
                    s.LastName,
                    s.NicNumber,
                    s.MobileNumber,
                    s.District,
                    s.PreferredJobCategories,
                    s.ResumeUrl,
                    RegisteredAt = s.User!.CreatedAt,
                    // Accepted wins over newer applications; otherwise the latest application's status
                    ApplicationStatus = s.Applications.Any(a => a.Status == ApplicationStatus.Accepted)
                        ? (ApplicationStatus?)ApplicationStatus.Accepted
                        : s.Applications.OrderByDescending(a => a.AppliedAt).Select(a => (ApplicationStatus?)a.Status).FirstOrDefault()
                })
                .ToList();

            return Ok(seekers);
        }

        // Candidate pool: every job seeker not yet accepted by a company. Covers candidates never
        // assigned to a vacancy and those still Applied / Reviewing / Shortlisted or Rejected
        [HttpGet("candidate-pool")]
        public IActionResult GetCandidatePool()
        {
            var pool = _context.JobSeekerProfiles
                .Include(s => s.User)
                .Where(s => !s.Applications.Any(a => a.Status == ApplicationStatus.Accepted))
                .OrderByDescending(s => s.User!.CreatedAt)
                .Select(s => new
                {
                    s.Id,
                    s.RefNo,
                    s.FirstName,
                    s.LastName,
                    s.NicNumber,
                    s.MobileNumber,
                    s.District,
                    s.PreferredZone,
                    s.PreferredJobCategories,
                    RegisteredAt = s.User!.CreatedAt,
                    LatestApplication = s.Applications
                        .OrderByDescending(a => a.AppliedAt)
                        .Select(a => new
                        {
                            JobTitle = a.JobPost!.Title,
                            CompanyName = a.JobPost.CompanyProfile!.CompanyName,
                            a.Status,
                            a.RejectionRemark
                        })
                        .FirstOrDefault()
                })
                .ToList();

            return Ok(pool);
        }

        [HttpPost("candidate-pool/{seekerId}/assign")]
        public IActionResult AssignCandidate(Guid seekerId, [FromBody] AssignCandidateDto dto)
        {
            var seeker = _context.JobSeekerProfiles.FirstOrDefault(s => s.Id == seekerId);
            if (seeker == null)
            {
                return NotFound(new { Message = "Job seeker profile not found." });
            }

            if (!_context.JobPosts.Any(j => j.Id == dto.JobPostId && j.IsActive))
            {
                return BadRequest(new { Message = "Selected job vacancy is no longer available." });
            }

            if (_context.JobApplications.Any(a => a.JobSeekerProfileId == seekerId && a.Status == ApplicationStatus.Accepted))
            {
                return BadRequest(new { Message = "This candidate has already been accepted by a company." });
            }

            if (_context.JobApplications.Any(a => a.JobSeekerProfileId == seekerId && a.JobPostId == dto.JobPostId))
            {
                return BadRequest(new { Message = "This candidate is already assigned to this vacancy." });
            }

            _context.JobApplications.Add(new JobApplication
            {
                JobPostId = dto.JobPostId,
                JobSeekerProfileId = seekerId,
                ResumeUrl = seeker.ResumeUrl,
                Status = ApplicationStatus.Applied
            });
            _context.SaveChanges();

            return Ok(new { Message = "Candidate assigned to the vacancy." });
        }

        // Latest weekly (or manual) matching of the candidate pool against active vacancies
        [HttpGet("matching")]
        public IActionResult GetLatestMatching()
        {
            var run = _context.MatchRuns
                .AsNoTracking()
                .Include(r => r.Results)
                .OrderByDescending(r => r.RunAt)
                .FirstOrDefault();

            var lastWeeklyRunAt = _context.MatchRuns
                .Where(r => !r.IsManual)
                .OrderByDescending(r => r.RunAt)
                .Select(r => (DateTime?)r.RunAt)
                .FirstOrDefault();

            if (run == null)
            {
                return Ok(new { Run = (object?)null, NextRunAt = (DateTime?)null });
            }

            // Flag pairs that changed since the run so the officer does not act on stale matches
            var stillInPool = _context.JobSeekerProfiles
                .Where(s => !s.Applications.Any(a => a.Status == ApplicationStatus.Accepted))
                .Select(s => s.Id)
                .ToHashSet();
            var activeJobs = _context.JobPosts.Where(j => j.IsActive).Select(j => j.Id).ToHashSet();
            var assignedPairs = _context.JobApplications
                .Select(a => new { a.JobSeekerProfileId, a.JobPostId })
                .AsEnumerable()
                .Select(a => (a.JobSeekerProfileId, a.JobPostId))
                .ToHashSet();

            return Ok(new
            {
                Run = new
                {
                    run.Id,
                    run.RunAt,
                    run.IsManual,
                    run.CandidateCount,
                    run.VacancyCount,
                    Results = run.Results
                        .OrderByDescending(r => r.Score)
                        .ThenBy(r => r.JobTitle)
                        .Select(r => new
                        {
                            r.Id,
                            r.JobSeekerProfileId,
                            r.CandidateRefNo,
                            r.CandidateName,
                            r.CandidateMobile,
                            r.JobPostId,
                            r.JobTitle,
                            r.CompanyName,
                            r.Score,
                            r.Reasons,
                            Availability = !stillInPool.Contains(r.JobSeekerProfileId) ? "CandidateAccepted"
                                : !activeJobs.Contains(r.JobPostId) ? "VacancyClosed"
                                : assignedPairs.Contains((r.JobSeekerProfileId, r.JobPostId)) ? "Assigned"
                                : "Available"
                        })
                },
                NextRunAt = lastWeeklyRunAt?.Add(CandidateMatcher.Interval)
            });
        }

        [HttpPost("matching/run")]
        public IActionResult RunMatching()
        {
            var run = CandidateMatcher.Run(_context, isManual: true);
            return Ok(new { Message = $"Matching complete: {run.Results.Count} matches found." });
        }

        [HttpPut("jobseeker/{id}")]
        public IActionResult UpdateJobSeeker(Guid id, [FromBody] JobSeekerProfileUpdateDto dto)
        {
            var seeker = _context.JobSeekerProfiles
                .Include(s => s.User)
                .FirstOrDefault(s => s.Id == id);

            if (seeker == null)
            {
                return NotFound(new { Message = "Job seeker profile not found." });
            }

            JobSeekerController.ApplyUpdate(seeker, dto);
            _context.SaveChanges();

            return Ok(JobSeekerController.MapToDto(seeker));
        }

        [HttpGet("jobs")]
        public IActionResult GetJobs()
        {
            var jobs = _context.JobPosts
                .Include(j => j.CompanyProfile)
                .OrderByDescending(j => j.CreatedAt)
                .Select(j => new
                {
                    j.Id,
                    j.Title,
                    j.Location,
                    j.JobType,
                    j.JobCategory,
                    j.SalaryRange,
                    j.IsActive,
                    j.CreatedAt,
                    CompanyName = j.CompanyProfile!.CompanyName,
                    CompanyId = j.CompanyProfileId
                })
                .ToList();

            return Ok(jobs);
        }

        [HttpDelete("user/{id}")]
        public IActionResult DeleteUser(Guid id)
        {
            var user = _context.Users.FirstOrDefault(u => u.Id == id);
            if (user == null)
            {
                return NotFound(new { Message = "User not found." });
            }

            if (user.Role == UserRole.Admin)
            {
                return BadRequest(new { Message = "Cannot delete Admin user." });
            }

            _context.Users.Remove(user);
            _context.SaveChanges();

            return Ok(new { Message = "User deleted successfully from system." });
        }

        [HttpDelete("job/{id}")]
        public IActionResult DeleteJob(Guid id)
        {
            var job = _context.JobPosts.FirstOrDefault(j => j.Id == id);
            if (job == null)
            {
                return NotFound(new { Message = "Job post not found." });
            }

            _context.JobPosts.Remove(job);
            _context.SaveChanges();

            return Ok(new { Message = "Job post moderated/deleted successfully." });
        }
    }
}
