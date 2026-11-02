using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

        public CompanyController(JobBankDbContext context)
        {
            _context = context;
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

            company.CompanyName = dto.CompanyName.Trim();
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
