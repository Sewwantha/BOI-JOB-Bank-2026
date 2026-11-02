using JobBank.Api.Models;

namespace JobBank.Api.DTOs.Application
{
    public class JobApplicationStatusUpdateDto
    {
        public ApplicationStatus Status { get; set; }

        // Required when Status is Rejected
        public string RejectionRemark { get; set; } = string.Empty;
    }
}
