using System.Collections.Generic;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace JobBank.Api.Data
{
    public record JobLocation(string LocCd, string LocName);

    /// <summary>
    /// Read-only access to the "Commonwtc" database (LocationConnection),
    /// which supplies the Preferred Job Locations (Zone) shown to job seekers.
    /// </summary>
    public class LocationDbService
    {
        private readonly string _connectionString;

        public LocationDbService(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("LocationConnection")
                ?? throw new System.InvalidOperationException("Connection string 'LocationConnection' is not configured.");
        }

        public List<JobLocation> GetLocations()
        {
            const string sql = @"
                SELECT LTRIM(RTRIM(LocCd)) AS LocCd, LTRIM(RTRIM(LocName)) AS LocName
                FROM Location
                WHERE LocName IS NOT NULL AND LTRIM(RTRIM(LocName)) <> ''
                ORDER BY LocName";

            var locations = new List<JobLocation>();
            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand(sql, conn);
            conn.Open();

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                locations.Add(new JobLocation(
                    reader["LocCd"]?.ToString() ?? string.Empty,
                    reader["LocName"]?.ToString() ?? string.Empty));
            }
            return locations;
        }
    }
}
