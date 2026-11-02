using System;
using System.Linq;
using JobBank.Api.Data;

namespace JobBank.Api.Helpers
{
    public static class RefNoGenerator
    {
        // Format: {last 4 NIC digits}-{yyyyMMdd}, e.g. 5678-20260925.
        // Two seekers with the same last 4 digits on the same day get a -2, -3... suffix.
        public static string Generate(JobBankDbContext context, string nicNumber)
        {
            var digits = new string((nicNumber ?? string.Empty).Where(char.IsDigit).ToArray());
            var last4 = digits.Length >= 4 ? digits[^4..] : digits.PadLeft(4, '0');
            var baseRefNo = $"{last4}-{DateTime.Now:yyyyMMdd}";

            var refNo = baseRefNo;
            var suffix = 2;
            while (context.JobSeekerProfiles.Any(s => s.RefNo == refNo)
                || context.JobSeekerProfiles.Local.Any(s => s.RefNo == refNo))
            {
                refNo = $"{baseRefNo}-{suffix++}";
            }

            return refNo;
        }
    }
}
