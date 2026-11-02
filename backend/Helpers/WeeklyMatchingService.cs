using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using JobBank.Api.Data;

namespace JobBank.Api.Helpers
{
    // Runs the candidate/vacancy matching once a week. Checks hourly against the last saved run,
    // so a restart neither skips a week nor runs twice.
    public class WeeklyMatchingService : BackgroundService
    {
        private static readonly TimeSpan CheckInterval = TimeSpan.FromHours(1);

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<WeeklyMatchingService> _logger;

        public WeeklyMatchingService(IServiceScopeFactory scopeFactory, ILogger<WeeklyMatchingService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            using var timer = new PeriodicTimer(CheckInterval);
            do
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<JobBankDbContext>();

                    var lastRunAt = context.MatchRuns
                        .Where(r => !r.IsManual)
                        .OrderByDescending(r => r.RunAt)
                        .Select(r => (DateTime?)r.RunAt)
                        .FirstOrDefault();

                    if (lastRunAt == null || DateTime.UtcNow - lastRunAt.Value >= CandidateMatcher.Interval)
                    {
                        var run = CandidateMatcher.Run(context, isManual: false);
                        _logger.LogInformation("Weekly matching found {Count} matches", run.Results.Count);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Weekly matching failed");
                }
            }
            while (await timer.WaitForNextTickAsync(stoppingToken));
        }
    }
}
