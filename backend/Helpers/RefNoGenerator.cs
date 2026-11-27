using System;
using System.Globalization;
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

        // The issue date is the yyyyMMdd part of the reference number; null if it cannot be read.
        public static DateTime? IssuedOn(string? refNo)
        {
            var parts = (refNo ?? string.Empty).Split('-');
            if (parts.Length >= 2
                && DateTime.TryParseExact(parts[1], "yyyyMMdd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
            {
                return date;
            }
            return null;
        }

        // A reference number is valid only on the day it was issued (server's local date).
        public static bool IsValidToday(string? refNo) => IssuedOn(refNo) == DateTime.Now.Date;
    }
}
