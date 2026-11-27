using System;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using JobBank.Api.Data;
using JobBank.Api.Helpers;
using JobBank.Api.Models;

var builder = WebApplication.CreateBuilder(args);

// Real connection strings and keys live in appsettings.Local.json (not committed)
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Serialize enums as strings
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Configure EF Core & SQL Server
builder.Services.AddDbContext<JobBankDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Shared "common" database: admin users (UsrUser) and zones (project)
builder.Services.AddScoped<CommonDbService>();

// "Commonwtc" database: Preferred Job Locations (Zone) for job seekers (Location table)
builder.Services.AddScoped<LocationDbService>();

// Weekly candidate pool / job vacancy matching
builder.Services.AddHostedService<WeeklyMatchingService>();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"] ?? "SuperSecretKeyThatIsVeryLongAndSecureForSigningTokens12345!");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "JobBankApi",
        ValidAudience = jwtSettings["Audience"] ?? "JobBankClient",
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero
    };
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", corsBuilder =>
    {
        corsBuilder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
    });
});

// Swagger/API Explorer
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Job Bank API", Version = "v1" });
    
    // Add JWT security definition for Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Enter JWT Bearer token **_only_**",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = new List<string>()
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Serve the React app (built into wwwroot by publish.ps1) for any non-API route;
// unknown /api URLs still get a 404 instead of the HTML page
app.MapFallback("/api/{**path}", () => Results.NotFound());
app.MapFallbackToFile("index.html");

// Auto-migrate and seed data on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<JobBankDbContext>();
        context.Database.Migrate();
        SeedData(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating or seeding the database.");
    }
}

app.Run();

// Seed data helper
void SeedData(JobBankDbContext context)
{
    if (context.Users.Any())
    {
        return; // DB has been seeded already
    }

    // Hash passwords simply using BCrypt or similar. For simplicity, we store plaintext or basic hash since we don't have external bcrypt lib, or we can use a custom quick hashing.
    // Let's use BCrypt-like standard SHA256 base64 hashing so it is robust!
    string HashPassword(string password)
    {
        using var sha = System.Security.Cryptography.SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    // 1. Create Users
    var admin = new User
    {
        Email = "admin@jobbank.com",
        PasswordHash = HashPassword("AdminPass123!"),
        Role = UserRole.Admin
    };

    var employer1 = new User
    {
        Email = "employer1@google.com",
        PasswordHash = HashPassword("EmployerPass123!"),
        Role = UserRole.Employer
    };

    var employer2 = new User
    {
        Email = "employer2@microsoft.com",
        PasswordHash = HashPassword("EmployerPass123!"),
        Role = UserRole.Employer
    };

    var seeker1 = new User
    {
        Email = "seeker1@gmail.com",
        PasswordHash = HashPassword("SeekerPass123!"),
        Role = UserRole.JobSeeker
    };

    var seeker2 = new User
    {
        Email = "seeker2@gmail.com",
        PasswordHash = HashPassword("SeekerPass123!"),
        Role = UserRole.JobSeeker
    };

    context.Users.AddRange(admin, employer1, employer2, seeker1, seeker2);
    context.SaveChanges();

    // 2. Create Company Profiles
    var googleProfile = new CompanyProfile
    {
        UserId = employer1.Id,
        CompanyName = "Google",
        Description = "Google's mission is to organize the world's information and make it universally accessible and useful.",
        Website = "https://google.com",
        Location = "Mountain View, CA",
        LogoUrl = "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=150&h=150&fit=crop"
    };

    var microsoftProfile = new CompanyProfile
    {
        UserId = employer2.Id,
        CompanyName = "Microsoft",
        Description = "Microsoft enables digital transformation for the era of an intelligent cloud and an intelligent edge.",
        Website = "https://microsoft.com",
        Location = "Redmond, WA",
        LogoUrl = "https://images.unsplash.com/photo-1625014020903-e329f586c990?w=150&h=150&fit=crop"
    };

    context.CompanyProfiles.AddRange(googleProfile, microsoftProfile);
    context.SaveChanges();

    // 3. Create Seeker Profiles
    var seekerProfile1 = new JobSeekerProfile
    {
        UserId = seeker1.Id,
        FirstName = "Alice",
        LastName = "Smith",
        Bio = "Passionate full-stack developer with 3 years of experience in React and C# .NET Core.",
        ResumeUrl = "https://example.com/resumes/alice_smith.pdf",
        Skills = "React, TypeScript, C#, ASP.NET Core, SQL Server, CSS",
        Experience = "Software Engineer at TechCorp (2 years), Intern at StartupCo (1 year)"
    };

    var seekerProfile2 = new JobSeekerProfile
    {
        UserId = seeker2.Id,
        FirstName = "Bob",
        LastName = "Jones",
        Bio = "Frontend developer skilled in styling, visual animation, and user interfaces.",
        ResumeUrl = "https://example.com/resumes/bob_jones.pdf",
        Skills = "HTML, CSS, Tailwind CSS, JavaScript, React, Figma",
        Experience = "UI Developer at WebStudio (1.5 years)"
    };

    context.JobSeekerProfiles.AddRange(seekerProfile1, seekerProfile2);
    context.SaveChanges();

    // 4. Create Job Posts
    var job1 = new JobPost
    {
        CompanyProfileId = googleProfile.Id,
        Title = "Senior Full-Stack Engineer",
        Description = "We are looking for a Senior Full-Stack Engineer to build next-generation cloud services using React, TypeScript, and modern backend stacks.",
        Requirements = "5+ years experience, solid knowledge of web APIs, microservices, and database performance tuning.",
        Location = "Remote (US)",
        SalaryRange = "120,000 - 160,000",
        JobType = JobType.FullTime,
        IsActive = true,
        CreatedAt = DateTime.UtcNow.AddDays(-5)
    };

    var job2 = new JobPost
    {
        CompanyProfileId = googleProfile.Id,
        Title = "Software Developer (Internship)",
        Description = "Kickstart your career as an intern at Google! You will work alongside engineering mentors to build features for millions of users.",
        Requirements = "Currently pursuing a degree in CS, knowledge of JavaScript/TypeScript, React, and data structures.",
        Location = "Mountain View, CA",
        SalaryRange = "45 - 60 / hour",
        JobType = JobType.Internship,
        IsActive = true,
        CreatedAt = DateTime.UtcNow.AddDays(-2)
    };

    var job3 = new JobPost
    {
        CompanyProfileId = microsoftProfile.Id,
        Title = "C# Backend Developer",
        Description = "Join the Azure development group to implement high-throughput REST APIs and messaging infrastructure.",
        Requirements = "Strong C# .NET skills, Entity Framework, SQL Server, and unit testing experience.",
        Location = "Redmond, WA",
        SalaryRange = "100,000 - 130,000",
        JobType = JobType.FullTime,
        IsActive = true,
        CreatedAt = DateTime.UtcNow.AddDays(-10)
    };

    context.JobPosts.AddRange(job1, job2, job3);
    context.SaveChanges();

    // 5. Create Job Applications
    var app1 = new JobApplication
    {
        JobPostId = job1.Id,
        JobSeekerProfileId = seekerProfile1.Id,
        ResumeUrl = seekerProfile1.ResumeUrl,
        CoverLetter = "I've been working with C# and React for the past 3 years and would love to bring my skills to Google. Looking forward to talking soon!",
        Status = ApplicationStatus.Reviewing,
        AppliedAt = DateTime.UtcNow.AddDays(-2)
    };

    var app2 = new JobApplication
    {
        JobPostId = job2.Id,
        JobSeekerProfileId = seekerProfile2.Id,
        ResumeUrl = seekerProfile2.ResumeUrl,
        CoverLetter = "Hello! I am a passionate front-end intern candidate and am super excited to apply for this internship.",
        Status = ApplicationStatus.Applied,
        AppliedAt = DateTime.UtcNow.AddDays(-1)
    };

    context.JobApplications.AddRange(app1, app2);
    context.SaveChanges();
}
