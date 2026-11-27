using System.Text.RegularExpressions;

namespace JobBank.Api.Helpers
{
    // Sri Lankan NIC numbers: old format = 9 digits + V/X (e.g. 951234567V),
    // new format = 12 digits (e.g. 199512345678).
    public static class NicHelper
    {
        public const int MaxLength = 12;
        public const string ErrorMessage =
            "NIC number must be 9 digits followed by V or X (old format) or 12 digits (new format).";

        private static readonly Regex Pattern = new(@"^(\d{9}[VX]|\d{12})$", RegexOptions.Compiled);

        /// <summary>Trims and upper-cases the trailing V/X.</summary>
        public static string Normalize(string? nic) => (nic ?? string.Empty).Trim().ToUpperInvariant();

        public static bool IsValid(string? nic) => Pattern.IsMatch(Normalize(nic));
    }
}
