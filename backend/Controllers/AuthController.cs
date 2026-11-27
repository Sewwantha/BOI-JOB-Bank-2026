using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using JobBank.Api.Data;
using JobBank.Api.DTOs.Auth;
using JobBank.Api.Helpers;
using JobBank.Api.Models;

namespace JobBank.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly JobBankDbContext _context;
        private readonly IConfiguration _config;
        private readonly CommonDbService _commonDb;

        public AuthController(JobBankDbContext context, IConfiguration config, CommonDbService commonDb)
        {
            _context = context;
            _config = config;
            _commonDb = commonDb;
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { Message = "Password is required." });
            }

            if (dto.Role == UserRole.Admin)
            {
                return BadRequest(new { Message = "Cannot register as Admin." });
            }

            var user = new User
            {
                PasswordHash = PasswordHasher.Hash(dto.Password),
                Role = dto.Role
            };

            if (dto.Role == UserRole.JobSeeker)
            {
                // Job Seekers register with NIC number
                if (string.IsNullOrWhiteSpace(dto.NicNumber))
                {
                    return BadRequest(new { Message = "NIC number is required for Job Seekers." });
                }

                var nicTrimmed = NicHelper.Normalize(dto.NicNumber);
                if (!NicHelper.IsValid(nicTrimmed))
                {
                    return BadRequest(new { Message = NicHelper.ErrorMessage });
                }

                if (_context.Users.Any(u => u.NicNumber == nicTrimmed))
                {
                    return BadRequest(new { Message = "A user with this NIC number already exists." });
                }

                user.NicNumber = nicTrimmed;
                user.Email = nicTrimmed; // Use NIC as email fallback for compatibility
            }
            else
            {
                // Employers register with email
                if (string.IsNullOrWhiteSpace(dto.Email))
                {
                    return BadRequest(new { Message = "Email is required for Employers." });
                }

                var emailNormalized = dto.Email.Trim().ToLower();
                if (_context.Users.Any(u => u.Email.ToLower() == emailNormalized))
                {
                    return BadRequest(new { Message = "User with this email already exists." });
                }

                user.Email = dto.Email.Trim();
            }

            _context.Users.Add(user);
            _context.SaveChanges();

            // Auto-provision empty profile
            Guid? profileId = null;
            string? refNo = null;
            if (dto.Role == UserRole.Employer)
            {
                var company = new CompanyProfile
                {
                    UserId = user.Id,
                    CompanyName = dto.Email.Split('@')[0] + "'s Company", // default name
                    Description = "Update company description here.",
                    Website = "",
                    Location = "",
                    LogoUrl = ""
                };
                _context.CompanyProfiles.Add(company);
                _context.SaveChanges();
                profileId = company.Id;
            }
            else if (dto.Role == UserRole.JobSeeker)
            {
                var seeker = new JobSeekerProfile
                {
                    UserId = user.Id,
                    RefNo = RefNoGenerator.Generate(_context, user.NicNumber),
                    FirstName = "First",
                    LastName = "Last",
                    NicNumber = user.NicNumber, // Copy NIC from registration
                    Bio = "Update bio here.",
                    ResumeUrl = "",
                    Skills = "",
                    Experience = ""
                };
                _context.JobSeekerProfiles.Add(seeker);
                _context.SaveChanges();
                profileId = seeker.Id;
                refNo = seeker.RefNo;
            }

            var token = GenerateJwtToken(user);

            return Ok(new AuthResponseDto
            {
                Token = token,
                Email = user.Email,
                Role = user.Role,
                UserId = user.Id,
                ProfileId = profileId,
                RefNo = refNo
            });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { Message = "Password is required." });
            }

            User? user = null;

            if (!string.IsNullOrWhiteSpace(dto.NicNumber))
            {
                // Login via NIC number (Job Seekers)
                var nicTrimmed = NicHelper.Normalize(dto.NicNumber);
                user = _context.Users
                    .Include(u => u.CompanyProfile)
                    .Include(u => u.JobSeekerProfile)
                    .FirstOrDefault(u => u.NicNumber == nicTrimmed);
            }
            else if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                // Login via Email (Employers)
                user = _context.Users
                    .Include(u => u.CompanyProfile)
                    .Include(u => u.JobSeekerProfile)
                    .FirstOrDefault(u => u.Email.ToLower() == dto.Email.Trim().ToLower());
            }
            else
            {
                return BadRequest(new { Message = "Email or NIC number is required." });
            }

            // Admins must sign in through the separate admin login endpoint
            if (user == null || user.Role == UserRole.Admin || user.PasswordHash != PasswordHasher.Hash(dto.Password))
            {
                return Unauthorized(new { Message = "Invalid credentials." });
            }

            // Checked after the password so the message does not reveal which accounts exist
            if (!user.IsActive)
            {
                return Unauthorized(new { Message = "Your account has been deactivated. Please contact the administrator." });
            }

            var token = GenerateJwtToken(user);

            Guid? profileId = null;
            if (user.Role == UserRole.Employer)
            {
                profileId = user.CompanyProfile?.Id;
            }
            else if (user.Role == UserRole.JobSeeker)
            {
                profileId = user.JobSeekerProfile?.Id;
            }

            return Ok(new AuthResponseDto
            {
                Token = token,
                Email = user.Email,
                Role = user.Role,
                UserId = user.Id,
                ProfileId = profileId
            });
        }

        // Admins sign in with their UserCode from the shared "common" database (UsrUser table)
        [HttpPost("admin-login")]
        public IActionResult AdminLogin([FromBody] AdminLoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.UserCode) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { Message = "User code and password are required." });
            }

            CommonUser? admin;
            try
            {
                admin = _commonDb.ValidateUser(dto.UserCode.Trim(), dto.Password);
            }
            catch (SqlException)
            {
                return StatusCode(503, new { Message = "Cannot connect to the user database. Please try again later." });
            }

            if (admin == null)
            {
                return Unauthorized(new { Message = "Invalid user code or password." });
            }

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, admin.UserCode),
                new Claim(ClaimTypes.Role, UserRole.Admin.ToString()),
                new Claim("role", UserRole.Admin.ToString()),
                new Claim("userCode", admin.UserCode),
                new Claim("locationCode", admin.LocationCode ?? string.Empty)
            };

            return Ok(new AuthResponseDto
            {
                Token = CreateToken(claims),
                Email = admin.UserCode,
                Role = UserRole.Admin,
                UserId = Guid.Empty,
                ProfileId = null,
                UserName = admin.UserName,
                LocationName = admin.LocationName
            });
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("role", user.Role.ToString()) // Add fallback for client decoding ease
            };

            return CreateToken(claims);
        }

        private string CreateToken(IEnumerable<Claim> claims)
        {
            var jwtSettings = _config.GetSection("Jwt");
            var keyStr = jwtSettings["Key"] ?? "SuperSecretKeyThatIsVeryLongAndSecureForSigningTokens12345!";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyStr));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var expiryDays = double.Parse(jwtSettings["DurationInDays"] ?? "7");
            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"] ?? "JobBankApi",
                audience: jwtSettings["Audience"] ?? "JobBankClient",
                claims: claims,
                expires: DateTime.UtcNow.AddDays(expiryDays),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
