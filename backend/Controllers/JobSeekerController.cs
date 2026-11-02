using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobBank.Api.Data;
using JobBank.Api.DTOs.JobSeeker;
using JobBank.Api.Models;

namespace JobBank.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JobSeekerController : ControllerBase
    {
        private readonly JobBankDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly IConfiguration _config;

        public JobSeekerController(JobBankDbContext context, IWebHostEnvironment env, IConfiguration config)
        {
            _context = context;
            _env = env;
            _config = config;
        }

        internal static JobSeekerProfileDto MapToDto(JobSeekerProfile seeker)
        {
            return new JobSeekerProfileDto
            {
                Id = seeker.Id,
                UserId = seeker.UserId,
                RefNo = seeker.RefNo,
                FirstName = seeker.FirstName,
                LastName = seeker.LastName,
                DateOfBirth = seeker.DateOfBirth,
                NicNumber = seeker.NicNumber,
                MobileNumber = seeker.MobileNumber,
                LandlineNumber = seeker.LandlineNumber,
                Gender = seeker.Gender,
                Address = seeker.Address,
                District = seeker.District,
                PreferredZone = seeker.PreferredZone,
                EducationalQualifications = seeker.EducationalQualifications,
                VocationalTraining = seeker.VocationalTraining,
                Bio = seeker.Bio,
                ResumeUrl = seeker.ResumeUrl,
                Skills = seeker.Skills,
                Experience = seeker.Experience,
                PreferredJobCategories = seeker.PreferredJobCategories,
                RegisteredAt = seeker.User?.CreatedAt ?? DateTime.UtcNow
            };
        }

        [HttpGet("{id}")]
        public IActionResult GetProfile(Guid id)
        {
            var seeker = _context.JobSeekerProfiles
                .Include(s => s.User)
                .FirstOrDefault(s => s.Id == id);

            if (seeker == null)
            {
                return NotFound(new { Message = "Job seeker profile not found." });
            }

            return Ok(MapToDto(seeker));
        }

        [HttpGet("user/{userId}")]
        public IActionResult GetProfileByUserId(Guid userId)
        {
            var seeker = _context.JobSeekerProfiles
                .Include(s => s.User)
                .FirstOrDefault(s => s.UserId == userId);

            if (seeker == null)
            {
                return NotFound(new { Message = "Job seeker profile not found for this user." });
            }

            return Ok(MapToDto(seeker));
        }

        [Authorize(Roles = "JobSeeker")]
        [HttpPut]
        public IActionResult UpdateProfile([FromBody] JobSeekerProfileUpdateDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
            {
                return Unauthorized(new { Message = "Invalid user token." });
            }

            var seeker = _context.JobSeekerProfiles
                .FirstOrDefault(s => s.UserId == userId);

            if (seeker == null)
            {
                return NotFound(new { Message = "Job seeker profile not found." });
            }

            ApplyUpdate(seeker, dto);
            _context.SaveChanges();

            return Ok(MapToDto(seeker));
        }

        // Shared by the seeker's own profile form and the admin edit screen
        internal static void ApplyUpdate(JobSeekerProfile seeker, JobSeekerProfileUpdateDto dto)
        {
            // Personal Information
            seeker.FirstName = (dto.FirstName ?? string.Empty).Trim();
            seeker.LastName = (dto.LastName ?? string.Empty).Trim();
            seeker.DateOfBirth = (dto.DateOfBirth ?? string.Empty).Trim();
            seeker.NicNumber = (dto.NicNumber ?? string.Empty).Trim();
            seeker.MobileNumber = (dto.MobileNumber ?? string.Empty).Trim();
            seeker.LandlineNumber = (dto.LandlineNumber ?? string.Empty).Trim();
            seeker.Gender = (dto.Gender ?? string.Empty).Trim();

            // Contact Information
            seeker.Address = (dto.Address ?? string.Empty).Trim();
            seeker.District = (dto.District ?? string.Empty).Trim();
            seeker.PreferredZone = (dto.PreferredZone ?? string.Empty).Trim();

            // Education & Training
            seeker.EducationalQualifications = (dto.EducationalQualifications ?? string.Empty).Trim();
            seeker.VocationalTraining = (dto.VocationalTraining ?? string.Empty).Trim();

            // Legacy fields
            seeker.Bio = (dto.Bio ?? string.Empty).Trim();
            seeker.ResumeUrl = (dto.ResumeUrl ?? string.Empty).Trim();
            seeker.Skills = (dto.Skills ?? string.Empty).Trim();
            seeker.Experience = (dto.Experience ?? string.Empty).Trim();

            // Preferred Job Categories
            seeker.PreferredJobCategories = (dto.PreferredJobCategories ?? string.Empty).Trim();
        }

        [HttpPost("parse-cv")]
        public async Task<IActionResult> ParseCv(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { Message = "No file uploaded." });
            }

            var extension = Path.GetExtension(file.FileName).ToLower();
            if (extension != ".pdf" && extension != ".docx" && extension != ".doc")
            {
                return BadRequest(new { Message = "Only PDF or DOCX files are allowed." });
            }

            // Keep the extension: parse_cv.py picks the reader based on it
            var tempFilePath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString() + extension);
            try
            {
                using (var stream = new FileStream(tempFilePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var pythonScriptPath = Path.Combine(_env.ContentRootPath, "parse_cv.py");
                var psi = new ProcessStartInfo
                {
                    // Under IIS the app pool may not have python on its PATH; set Python:Path to the full python.exe path
                    FileName = _config["Python:Path"] ?? "python",
                    Arguments = $"\"{pythonScriptPath}\" \"{tempFilePath}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(psi);
                if (process == null)
                {
                    return StatusCode(500, new { Message = "Failed to start python parsing process." });
                }

                string output = await process.StandardOutput.ReadToEndAsync();
                string error = await process.StandardError.ReadToEndAsync();
                await process.WaitForExitAsync();

                if (process.ExitCode != 0)
                {
                    return StatusCode(500, new { Message = "Python parser error", Details = error });
                }

                var parsedResult = System.Text.Json.JsonSerializer.Deserialize<object>(output);
                return Ok(parsedResult);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while parsing CV.", Details = ex.Message });
            }
            finally
            {
                if (System.IO.File.Exists(tempFilePath))
                {
                    try
                    {
                        System.IO.File.Delete(tempFilePath);
                    }
                    catch { /* ignore */ }
                }
            }
        }
    }
}
