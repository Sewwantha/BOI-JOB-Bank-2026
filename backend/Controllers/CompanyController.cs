using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using JobBank.Api.Data;
using JobBank.Api.DTOs.Company;
using JobBank.Api.Models;

namespace JobBank.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CompanyController : ControllerBase
    {
        private readonly JobBankDbContext _context;
        private readonly CommonDbService _commonDb;

        public CompanyController(JobBankDbContext context, CommonDbService commonDb)
        {
            _context = context;
            _commonDb = commonDb;
        }

        // Search official company names (BOI common database) for the company picker.
        // Anonymous because employers use it while registering.
        [AllowAnonymous]
        [HttpGet("official")]
        public IActionResult SearchOfficialCompanies([FromQuery] string? search)
        {
            try
            {
                return Ok(_commonDb.SearchCompanies(search ?? string.Empty));
            }
            catch (SqlException)
            {
                return StatusCode(503, new { Message = "Cannot connect to the company database. Please try again later." });
            }
        }

        [HttpGet("{id}")]
        public IActionResult GetProfile(Guid id)
        {
            var company = _context.CompanyProfiles
                .FirstOrDefault(c => c.Id == id);

            if (company == null)
            {
                return NotFound(new { Message = "Company profile not found." });
            }

            return Ok(new CompanyProfileDto
            {
                Id = company.Id,
                UserId = company.UserId,
                CompanyName = company.CompanyName,
                Description = company.Description,
                Website = company.Website,
                Location = company.Location,
                LogoUrl = company.LogoUrl
            });
        }

        [HttpGet("user/{userId}")]
        public IActionResult GetProfileByUserId(Guid userId)
        {
            var company = _context.CompanyProfiles
                .FirstOrDefault(c => c.UserId == userId);

            if (company == null)
            {
                return NotFound(new { Message = "Company profile not found for this user." });
            }

            return Ok(new CompanyProfileDto
            {
                Id = company.Id,
                UserId = company.UserId,
                CompanyName = company.CompanyName,
                Description = company.Description,
                Website = company.Website,
                Location = company.Location,
                LogoUrl = company.LogoUrl
            });
        }

        [Authorize(Roles = "Employer")]
        [HttpPut]
        public IActionResult UpdateProfile([FromBody] CompanyProfileUpdateDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
            {
                return Unauthorized(new { Message = "Invalid user token." });
            }

            var company = _context.CompanyProfiles
                .FirstOrDefault(c => c.UserId == userId);

            if (company == null)
            {
                return NotFound(new { Message = "Company profile not found." });
            }

            // The company name must be an official name, so the vacancy zone can be found.
            // Only checked when it changes, so older profiles can still save their other details.
            var newName = (dto.CompanyName ?? string.Empty).Trim();
            if (!string.Equals(newName, company.CompanyName.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                OfficialCompany? official;
                try
                {
                    official = _commonDb.FindCompany(newName);
                }
                catch (SqlException)
                {
                    return StatusCode(503, new { Message = "Cannot connect to the company database. Please try again later." });
                }
                if (official == null)
                {
                    return BadRequest(new { Message = "Please select your company from the official company list." });
                }
                newName = official.Name;
            }

            company.CompanyName = newName;
            company.Description = dto.Description.Trim();
            company.Website = dto.Website.Trim();
            company.Location = dto.Location.Trim();
            company.LogoUrl = dto.LogoUrl.Trim();

            _context.SaveChanges();

            return Ok(new CompanyProfileDto
            {
                Id = company.Id,
                UserId = company.UserId,
                CompanyName = company.CompanyName,
                Description = company.Description,
                Website = company.Website,
                Location = company.Location,
                LogoUrl = company.LogoUrl
            });
        }
    }
}
