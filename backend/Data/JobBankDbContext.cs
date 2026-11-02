using Microsoft.EntityFrameworkCore;
using JobBank.Api.Models;

namespace JobBank.Api.Data
{
    public class JobBankDbContext : DbContext
    {
        public JobBankDbContext(DbContextOptions<JobBankDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<CompanyProfile> CompanyProfiles => Set<CompanyProfile>();
        public DbSet<JobSeekerProfile> JobSeekerProfiles => Set<JobSeekerProfile>();
        public DbSet<JobPost> JobPosts => Set<JobPost>();
        public DbSet<JobApplication> JobApplications => Set<JobApplication>();
        public DbSet<MatchRun> MatchRuns => Set<MatchRun>();
        public DbSet<MatchResult> MatchResults => Set<MatchResult>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Unique email constraint
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // NicNumber: max 10 chars, unique (filtered to non-empty so employers don't conflict)
            modelBuilder.Entity<User>()
                .Property(u => u.NicNumber)
                .HasMaxLength(10);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.NicNumber)
                .IsUnique()
                .HasFilter("[NicNumber] <> ''");

            // RefNo: {last 4 NIC digits}-{yyyyMMdd}[-n], unique (filtered to non-empty)
            modelBuilder.Entity<JobSeekerProfile>()
                .Property(j => j.RefNo)
                .HasMaxLength(20);

            modelBuilder.Entity<JobSeekerProfile>()
                .HasIndex(j => j.RefNo)
                .IsUnique()
                .HasFilter("[RefNo] <> ''");

            // User - CompanyProfile (One-to-One)
            modelBuilder.Entity<User>()
                .HasOne(u => u.CompanyProfile)
                .WithOne(c => c.User)
                .HasForeignKey<CompanyProfile>(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // User - JobSeekerProfile (One-to-One)
            modelBuilder.Entity<User>()
                .HasOne(u => u.JobSeekerProfile)
                .WithOne(j => j.User)
                .HasForeignKey<JobSeekerProfile>(j => j.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // CompanyProfile - JobPost (One-to-Many)
            modelBuilder.Entity<JobPost>()
                .HasOne(j => j.CompanyProfile)
                .WithMany(c => c.JobPosts)
                .HasForeignKey(j => j.CompanyProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            // JobSeekerProfile - JobApplication (One-to-Many)
            modelBuilder.Entity<JobApplication>()
                .HasOne(a => a.JobSeekerProfile)
                .WithMany(j => j.Applications)
                .HasForeignKey(a => a.JobSeekerProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            // JobPost - JobApplication (One-to-Many)
            modelBuilder.Entity<JobApplication>()
                .HasOne(a => a.JobPost)
                .WithMany(j => j.Applications)
                .HasForeignKey(a => a.JobPostId)
                .OnDelete(DeleteBehavior.NoAction); // Disable cascade on one side to prevent multiple cascade paths in SQL Server

            // MatchRun - MatchResult (One-to-Many)
            modelBuilder.Entity<MatchResult>()
                .HasOne(r => r.MatchRun)
                .WithMany(m => m.Results)
                .HasForeignKey(r => r.MatchRunId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
