using System.Linq;
using System.Collections.Generic;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace JobBank.Api.Data
{
    public record CommonUser(string UserCode, string UserName, string? LocationCode, string? LocationName);

    /// <summary>
    /// Read-only access to the shared "common" database (UsrUser, Location, site, project tables).
    /// </summary>
    public class CommonDbService
    {
        private readonly string _connectionString;

        public CommonDbService(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("CommonConnection")
                ?? throw new System.InvalidOperationException("Connection string 'CommonConnection' is not configured.");
        }

        /// <summary>
        /// Returns the active admin (DeptCd 15) matching the user code and password, or null if the credentials are invalid.
        /// </summary>
        public CommonUser? ValidateUser(string userCode, string password)
        {
            const string sql = @"
                SELECT u.UserCode, u.UserName, u.Password, u.LocationCode, l.LocName
                FROM UsrUser u
                LEFT JOIN Location l ON l.LocCd = u.LocationCode
                WHERE u.UserCode = @userCode AND u.State = 1 AND u.DeptCd = '15'";

            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@userCode", userCode);
            conn.Open();

            using var reader = cmd.ExecuteReader();
            if (!reader.Read())
            {
                return null;
            }

            // Compare in code so the check is case-sensitive regardless of the database collation
            var storedPassword = reader["Password"] as string;
            if (storedPassword == null || storedPassword.TrimEnd() != password)
            {
                return null;
            }

            return new CommonUser(
                ((string)reader["UserCode"]).Trim(),
                (reader["UserName"] as string)?.Trim() ?? string.Empty,
                (reader["LocationCode"] as string)?.Trim(),
                (reader["LocName"] as string)?.Trim());
        }

        /// <summary>
        /// Zone name (Location.LocName) for each company name, matched to project.PRJNAME.
        /// project -> site.FACZONECD -> Location.PhyLocCode (the reverse of GetZonesForLocation).
        /// Companies with no matching project are left out. Keys are case-insensitive.
        /// </summary>
        public Dictionary<string, string> GetZonesForCompanies(IEnumerable<string> companyNames)
        {
            var result = new Dictionary<string, string>(System.StringComparer.OrdinalIgnoreCase);
            var names = new List<string>();
            foreach (var n in companyNames)
            {
                var trimmed = (n ?? string.Empty).Trim();
                if (trimmed.Length > 0 && !names.Contains(trimmed, System.StringComparer.OrdinalIgnoreCase))
                {
                    names.Add(trimmed);
                }
            }
            if (names.Count == 0)
            {
                return result;
            }

            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand { Connection = conn };
            var paramNames = new List<string>();
            for (int i = 0; i < names.Count; i++)
            {
                paramNames.Add($"@n{i}");
                cmd.Parameters.AddWithValue($"@n{i}", names[i].ToUpperInvariant());
            }
            cmd.CommandText = $@"
                SELECT DISTINCT UPPER(LTRIM(RTRIM(p.PRJNAME))) AS PRJNAME, LTRIM(RTRIM(l.LocName)) AS LocName
                FROM project p
                JOIN site s ON s.REFNO = p.REFNO AND s.PRJTYPE = p.PRJTYPE
                JOIN Location l ON l.PhyLocCode = s.FACZONECD
                WHERE UPPER(LTRIM(RTRIM(p.PRJNAME))) IN ({string.Join(", ", paramNames)})
                  AND l.LocName IS NOT NULL AND LTRIM(RTRIM(l.LocName)) <> ''
                ORDER BY LocName";
            conn.Open();

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                var company = reader.GetString(0);
                var zone = reader.GetString(1);
                // A company with sites in several zones shows them all, e.g. "EPZ - Katunayake / EPZ - Biyagama"
                result[company] = result.TryGetValue(company, out var existing) ? $"{existing} / {zone}" : zone;
            }
            return result;
        }

        /// <summary>
        /// Project names (project.PRJNAME) whose site is in the zone of the given user location.
        /// UsrUser.LocationCode -> Location.PhyLocCode -> site.FACZONECD -> project.
        /// </summary>
        public List<string> GetZonesForLocation(string locationCode)
        {
            const string sql = @"
                SELECT DISTINCT LTRIM(RTRIM(p.PRJNAME)) AS PRJNAME
                FROM Location l
                JOIN site s ON s.FACZONECD = l.PhyLocCode
                JOIN project p ON p.REFNO = s.REFNO AND p.PRJTYPE = s.PRJTYPE
                WHERE l.LocCd = @locationCode AND p.PRJNAME IS NOT NULL AND LTRIM(RTRIM(p.PRJNAME)) <> ''
                AND p.PRJTYPE='GENN'
                AND p.PRJSTAT in ('B1','C2','C1','D1','E1')
                ORDER BY PRJNAME";

            var zones = new List<string>();
            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@locationCode", locationCode);
            conn.Open();

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                zones.Add(reader.GetString(0));
            }
            return zones;
        }
    }
}
