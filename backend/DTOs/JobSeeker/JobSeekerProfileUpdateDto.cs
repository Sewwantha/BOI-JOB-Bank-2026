namespace JobBank.Api.DTOs.JobSeeker
{
    public class JobSeekerProfileUpdateDto
    {
        // Personal Information
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string DateOfBirth { get; set; } = string.Empty;
        public string NicNumber { get; set; } = string.Empty;
        public string MobileNumber { get; set; } = string.Empty;
        public string LandlineNumber { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;

        // Contact Information
        public string Address { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string PreferredZone { get; set; } = string.Empty;

        // Education & Training
        public string EducationalQualifications { get; set; } = string.Empty;
        public string VocationalTraining { get; set; } = string.Empty;

        // Legacy fields
        public string Bio { get; set; } = string.Empty;
        public string ResumeUrl { get; set; } = string.Empty;
        public string Skills { get; set; } = string.Empty;
        public string Experience { get; set; } = string.Empty;

        // Preferred Job Categories
        public string PreferredJobCategories { get; set; } = string.Empty;
    }
}
