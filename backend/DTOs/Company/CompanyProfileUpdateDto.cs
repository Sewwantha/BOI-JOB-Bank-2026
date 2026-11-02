namespace JobBank.Api.DTOs.Company
{
    public class CompanyProfileUpdateDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Website { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string LogoUrl { get; set; } = string.Empty;
    }
}
