using System.Linq;
using System.Collections.Generic;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace JobBank.Api.Data
{
    // A company as registered with BOI in the common database (project.PRJNAME) and its zone(s)
    public record OfficialCompany(string Name, string Zone);

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

        // Official company list: main company records (PRJTYPE 'GENN'), with the zone of their site if any.
        // The zone list is aggregated in .NET so one row comes back per site.
        private const string OfficialCompanySql = @"
            SELECT DISTINCT TOP (@limit) LTRIM(RTRIM(p.PRJNAME)) AS PRJNAME, LTRIM(RTRIM(l.LocName)) AS LocName
            FROM project p
            LEFT JOIN site s ON s.REFNO = p.REFNO AND s.PRJTYPE = p.PRJTYPE
            LEFT JOIN Location l ON l.PhyLocCode = s.FACZONECD
            WHERE p.PRJTYPE = 'GENN' AND p.PRJNAME IS NOT NULL AND LTRIM(RTRIM(p.PRJNAME)) <> ''
              AND {0}
            ORDER BY PRJNAME";

        private List<OfficialCompany> QueryOfficialCompanies(string condition, int limit, params (string Name, object Value)[] parameters)
        {
            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand(string.Format(OfficialCompanySql, condition), conn);
            cmd.Parameters.AddWithValue("@limit", limit);
            foreach (var (name, value) in parameters)
            {
                cmd.Parameters.AddWithValue(name, value);
            }
            conn.Open();

            // Merge rows of the same company (one per site) into "Zone A / Zone B"
            var byName = new Dictionary<string, OfficialCompany>(System.StringComparer.OrdinalIgnoreCase);
            var order = new List<string>();
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                var name = reader.GetString(0);
                var zone = reader.IsDBNull(1) ? string.Empty : reader.GetString(1);
                if (!byName.TryGetValue(name, out var existing))
                {
                    byName[name] = new OfficialCompany(name, zone);
                    order.Add(name);
                }
                else if (zone.Length > 0 && !existing.Zone.Split(" / ").Contains(zone))
                {
                    byName[name] = existing with { Zone = existing.Zone.Length > 0 ? $"{existing.Zone} / {zone}" : zone };
                }
            }
            return order.Select(n => byName[n]).ToList();
        }

        /// <summary>Official companies whose name contains the search text (at most 20).</summary>
        public List<OfficialCompany> SearchCompanies(string search)
        {
            var term = (search ?? string.Empty).Trim();
            if (term.Length < 2)
            {
                return new List<OfficialCompany>();
            }
            // Escape LIKE wildcards typed by the user
            var escaped = term.ToUpperInvariant().Replace("[", "[[]").Replace("%", "[%]").Replace("_", "[_]");
            return QueryOfficialCompanies("UPPER(p.PRJNAME) LIKE @term", 60, ("@term", $"%{escaped}%")).Take(20).ToList();
        }

        /// <summary>The official company with exactly this name (case-insensitive), or null.</summary>
        public OfficialCompany? FindCompany(string companyName)
        {
            var name = (companyName ?? string.Empty).Trim();
            if (name.Length == 0)
            {
                return null;
            }
            return QueryOfficialCompanies("UPPER(LTRIM(RTRIM(p.PRJNAME))) = @name", 20, ("@name", name.ToUpperInvariant())).FirstOrDefault();
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
