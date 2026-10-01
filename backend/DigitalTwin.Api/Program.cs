using DigitalTwin.Api.Middleware;
using DigitalTwin.Application;
using DigitalTwin.Infrastructure;
using DigitalTwin.Infrastructure.Persistence;
using DigitalTwin.Infrastructure.SignalR;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add Layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// Add Controllers & SignalR
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Industrial Digital Twin API",
        Version = "v1",
        Description = "API for industrial digital twin monitoring, real-time telemetry, and anomaly alerts."
    });
});

// CORS configuration for Frontend (React / Vite / Angular)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendDev", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173", "https://localhost:5173",
                "http://localhost:3000", "https://localhost:3000",
                "http://localhost:4200", "https://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Force binding on all interfaces (not just localhost/::1)
builder.WebHost.UseUrls("http://0.0.0.0:5000");

var app = builder.Build();

// Global Exception Handling Middleware
app.UseMiddleware<GlobalExceptionMiddleware>();

// Automatically migrate & seed database on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var dbContext = services.GetRequiredService<DigitalTwinDbContext>();
        logger.LogInformation("Applying database migrations...");
        try
        {
            await dbContext.Database.MigrateAsync();
        }
        catch (Exception migEx)
        {
            logger.LogWarning(migEx, "MigrateAsync failed. Attempting EnsureCreatedAsync fallback...");
            await dbContext.Database.EnsureCreatedAsync();
        }

        logger.LogInformation("Seeding demonstration plant data...");
        await DbSeeder.SeedAsync(dbContext, logger);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while initializing/seeding the database.");
    }
}

// HTTP pipeline configuration
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Digital Twin API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseRouting();
app.UseCors("AllowFrontendDev");

app.MapControllers();
app.MapHub<DigitalTwinHub>("/hubs/digital-twin", options =>
{
    options.Transports = Microsoft.AspNetCore.Http.Connections.HttpTransportType.WebSockets
        | Microsoft.AspNetCore.Http.Connections.HttpTransportType.LongPolling;
});

app.Run();
