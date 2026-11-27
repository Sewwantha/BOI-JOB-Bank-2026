using JobBank.Api.Models;

namespace JobBank.Api.DTOs.Auth
{
    public class RegisterDto
    {
        public string Email { get; set; } = string.Empty;
        public string NicNumber { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public UserRole Role { get; set; }

        // Employers: official company name chosen from the company list (BOI common database)
        public string CompanyName { get; set; } = string.Empty;
    }
}
