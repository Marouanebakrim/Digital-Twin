using System.Text.Json;
using DigitalTwin.Simulator.Profiles;
using DigitalTwin.Simulator.Scenarios;

namespace DigitalTwin.Simulator;

/// <summary>
/// Background worker that continuously publishes simulated sensor readings to the Digital Twin API.
///
/// Modes:
///   normal   â†’ readings stay within sensor thresholds with gradual drift and noise
///   warning  â†’ readings drift toward the warning zone (â‰¤10% over threshold)
///   critical â†’ readings drift deep into critical zone  (>10% over threshold)
///   scenario â†’ runs the "Crusher Failure" pre-scripted incident scenario
///
/// Architecture:
///   â€¢ Reads all machines + sensors from GET /api/digital-twin  at startup
///   â€¢ Sends readings via POST /api/sensors/{sensorId}/readings
///   â€¢ No direct DB access â€” the Simulator is a pure API client
/// </summary>
public class SimulatorWorker : BackgroundService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SimulatorWorker> _logger;

    // â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private string _mode = "normal";
    private int _intervalMs = 2000;
    private bool _isRunning = true;
    private DateTime? _startedAt;

    // â”€â”€ Machine profiles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private readonly List<MachineSimProfile> _profiles = [];

    // â”€â”€ Scenario runner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private CrusherFailureScenario? _scenario;

    // â”€â”€ Public status (read by SimulatorController) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    public string Mode => _mode;
    public int IntervalMs => _intervalMs;
    public bool IsRunning => _isRunning;
    public DateTime? StartedAt => _startedAt;

    public void SetMode(string mode)
    {
        _logger.LogInformation("Simulator mode changed: {Old} â†’ {New}", _mode, mode);
        _mode = mode;
        if (mode == "scenario")
            _scenario = new CrusherFailureScenario(_logger);
        else
            _scenario = null;
    }

    public SimulatorWorker(
        IHttpClientFactory httpFactory,
        IConfiguration configuration,
        ILogger<SimulatorWorker> logger)
    {
        _httpFactory   = httpFactory;
        _configuration = configuration;
        _logger        = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _startedAt = DateTime.UtcNow;
        _logger.LogInformation("Digital Twin Simulator starting...");

        // â”€â”€ Bootstrap: fetch machine + sensor catalogue from API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        await BootstrapProfilesAsync(stoppingToken);

        if (_profiles.Count == 0)
        {
            _logger.LogError("No machine profiles loaded. Simulator cannot run.");
            return;
        }

        _logger.LogInformation("Simulator running with {Count} machine profile(s). Mode: {Mode}",
            _profiles.Count, _mode);

        // â”€â”€ Main loop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        while (!stoppingToken.IsCancellationRequested && _isRunning)
        {
            try
            {
                await TickAsync(stoppingToken);
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Simulator tick error. Will retry in {Interval}ms.", _intervalMs);
            }

            await Task.Delay(_intervalMs, stoppingToken);
        }

        _logger.LogInformation("Simulator stopped.");
    }

    // â”€â”€ Bootstrap â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private async Task BootstrapProfilesAsync(CancellationToken ct)
    {
        var maxRetries = 10;
        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                var client = _httpFactory.CreateClient("DigitalTwinApi");
                var topology = await client.GetFromJsonAsync<PlantTopologyResponse>(
                    "api/digital-twin", ct);

                if (topology?.Nodes == null || topology.Nodes.Count == 0)
                {
                    _logger.LogWarning("API returned no machines (attempt {A}/{M}).", attempt, maxRetries);
                    await Task.Delay(3000, ct);
                    continue;
                }

                foreach (var node in topology.Nodes)
                {
                    var sensors = await client.GetFromJsonAsync<List<SensorResponse>>(
                        $"api/machines/{node.Id}/sensors", ct);

                    if (sensors is null || sensors.Count == 0) continue;

                    _profiles.Add(new MachineSimProfile(node.Id, node.Code, node.Name, sensors));
                    _logger.LogInformation("  Loaded machine {Code} with {N} sensor(s).", node.Code, sensors.Count);
                }

                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to bootstrap profiles (attempt {A}/{M}). Retrying in 3s...", attempt, maxRetries);
                await Task.Delay(3000, ct);
            }
        }
    }

    // â”€â”€ Tick â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private async Task TickAsync(CancellationToken ct)
    {
        if (_mode == "scenario" && _scenario != null)
        {
            await _scenario.TickAsync(_profiles, _httpFactory, ct);
            return;
        }

        var client = _httpFactory.CreateClient("DigitalTwinApi");
        var tasks = new List<Task>();

        foreach (var profile in _profiles)
        {
            foreach (var sensor in profile.Sensors)
            {
                var value = GenerateValue(sensor, _mode);
                tasks.Add(PostReadingAsync(client, sensor.Id, value, ct));
            }
        }
        await Task.WhenAll(tasks);
    }

    // â”€â”€ Value generation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private static readonly Random _rng = new();

    private static double GenerateValue(SensorResponse sensor, string mode)
    {
        var min = sensor.MinValue ?? 0;
        var max = sensor.MaxValue ?? 100;
        var range = max - min;
        var midpoint = (min + max) / 2.0;

        return mode switch
        {
            "warning"  => GenerateWarningValue(min, max, range),
            "critical" => GenerateCriticalValue(min, max, range),
            _          => GenerateNormalValue(midpoint, range)
        };
    }

    /// Normal: Gaussian-like value centered at midpoint with Â±5% noise
    private static double GenerateNormalValue(double midpoint, double range)
    {
        var noise = ((_rng.NextDouble() * 2) - 1) * range * 0.05;
        var drift = Math.Sin(DateTime.UtcNow.Ticks / 1e10) * range * 0.03;
        return Math.Round(midpoint + noise + drift, 3);
    }

    /// Warning: slightly outside [min,max], deviation 5-10%
    private static double GenerateWarningValue(double min, double max, double range)
    {
        var deviationFactor = 0.05 + _rng.NextDouble() * 0.05; // 5â€“10%
        return _rng.NextDouble() > 0.5
            ? Math.Round(max + range * deviationFactor, 3)
            : Math.Round(min - range * deviationFactor, 3);
    }

    /// Critical: deep outside [min,max], deviation 11-25%
    private static double GenerateCriticalValue(double min, double max, double range)
    {
        var deviationFactor = 0.11 + _rng.NextDouble() * 0.14; // 11â€“25%
        return _rng.NextDouble() > 0.5
            ? Math.Round(max + range * deviationFactor, 3)
            : Math.Round(min - range * deviationFactor, 3);
    }

    // â”€â”€ HTTP helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    internal static async Task PostReadingAsync(
        HttpClient client,
        Guid sensorId,
        double value,
        CancellationToken ct)
    {
        var payload = new { value, timestamp = (DateTime?)null };
        var response = await client.PostAsJsonAsync(
            $"api/sensors/{sensorId}/readings", payload, ct);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            throw new HttpRequestException(
                $"POST readings for sensor {sensorId} failed ({response.StatusCode}): {body}");
        }
    }

    // â”€â”€ Response models â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private record PlantTopologyResponse(
        Guid PlantId,
        string PlantName,
        List<MachineNodeResponse> Nodes,
        List<object> Edges);

    private record MachineNodeResponse(Guid Id, string Code, string Name, string Type, string Status);
}
