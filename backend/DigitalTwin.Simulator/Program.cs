using DigitalTwin.Simulator;

var builder = WebApplication.CreateBuilder(args);

// -- Simulator background service ---------------------------------------------
builder.Services.AddSingleton<SimulatorWorker>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<SimulatorWorker>());

// -- HTTP client for the Digital Twin API -------------------------------------
var apiBaseUrl = builder.Configuration["DigitalTwinApi:BaseUrl"] ?? "http://localhost:5000/";
builder.Services.AddHttpClient("DigitalTwinApi", client =>
{
    client.BaseAddress = new Uri(apiBaseUrl);
    client.Timeout = TimeSpan.FromSeconds(10);
});

// -- Minimal Web API for simulator control ------------------------------------
builder.Services.AddControllers();

// -- CORS: allow Angular frontend (localhost:4200) to call the simulator API --
// BUG FIX #1 (CRITICAL): Without this, the browser blocks POST /api/simulator/mode
// with a CORS preflight error. The button calls simulatorService.setMode("scenario")
// which silently fails in the browser. PowerShell/curl do NOT enforce CORS.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendDev", policy =>
    {
        policy.WithOrigins(
                "http://localhost:4200", "https://localhost:4200",
                "http://localhost:5173", "https://localhost:5173",
                "http://localhost:3000", "https://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// CORS middleware must be applied BEFORE MapControllers/routing
app.UseCors("AllowFrontendDev");
app.MapControllers();
app.MapGet("/health", () => "Simulator OK");

app.Run();