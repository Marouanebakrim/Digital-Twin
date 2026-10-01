using DigitalTwin.Simulator.Profiles;
using Microsoft.Extensions.Logging;

namespace DigitalTwin.Simulator.Scenarios;

/// <summary>
/// "Crusher Failure" pre-scripted incident scenario on machine CR-001.
///
/// Timeline (each step = one simulator tick @ 2000ms):
///   Phase 1 (Ticks 1-6):    Normal operation — all machines RUNNING, CR-001 vibration ~2.2 mm/s.
///   Phase 2 (Ticks 7-14):   Rising vibration into Warning zone (3.4 -> 4.10 -> 4.30 mm/s, threshold = 4.0 mm/s).
///   Phase 3 (Ticks 15-24):  Critical overload (4.45 -> 5.50 mm/s, critical threshold = 4.35 mm/s).
///   Phase 4 (Ticks 25-32):  Peak failure (5.6 - 6.0 mm/s, speed drop).
///   Phase 5 (Ticks 33-42):  Gradual cooldown & recovery (4.8 -> 3.6 -> 2.3 mm/s).
///   Phase 6 (Ticks 43+):    Nominal operation restored (~2.2 mm/s, machine auto-recovers to RUNNING).
/// </summary>
public sealed class CrusherFailureScenario
{
    private readonly ILogger _logger;
    private int _tick = 0;

    public CrusherFailureScenario(ILogger logger)
    {
        _logger = logger;
        _logger.LogInformation("💥 'Crusher Failure' demonstration scenario started at Phase 1 (Normal).");
    }

    public async Task TickAsync(
        List<MachineSimProfile> profiles,
        IHttpClientFactory httpFactory,
        CancellationToken ct)
    {
        _tick++;
        var client = httpFactory.CreateClient("DigitalTwinApi");

        var phase = GetPhase();
        _logger.LogInformation("Scenario tick {Tick} — Phase {Phase}", _tick, phase);

        var tasks = new List<Task>();
        foreach (var profile in profiles)
        {
            foreach (var sensor in profile.Sensors.Where(s => s.IsActive))
            {
                var value = GenerateScenarioValue(profile.Code, sensor, phase, _tick);
                tasks.Add(PostSensorReadingSafelyAsync(client, sensor.Id, sensor.Code, value, _logger, ct));
            }
        }
        await Task.WhenAll(tasks);
    }

    private static async Task PostSensorReadingSafelyAsync(
        HttpClient client,
        Guid sensorId,
        string sensorCode,
        double value,
        ILogger logger,
        CancellationToken ct)
    {
        try
        {
            await SimulatorWorker.PostReadingAsync(client, sensorId, value, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Scenario: failed to post reading for {Sensor}", sensorCode);
        }
    }

    public ScenarioPhase GetPhase() => _tick switch
    {
        <= 6  => ScenarioPhase.Normal,
        <= 14 => ScenarioPhase.Warning,
        <= 24 => ScenarioPhase.Critical,
        <= 32 => ScenarioPhase.Failure,
        <= 42 => ScenarioPhase.Recovery,
        _     => ScenarioPhase.NominalRestored
    };

    private static readonly Random _rng = new();

    private static double GenerateScenarioValue(
        string machineCode,
        SensorResponse sensor,
        ScenarioPhase phase,
        int tick)
    {
        var min = sensor.MinValue ?? 0;
        var max = sensor.MaxValue ?? 100;
        var mid = (min + max) / 2.0;
        var range = max - min;

        // Crusher CR-001 specific incident behaviour
        if (machineCode == "CR-001")
        {
            return sensor.SensorType switch
            {
                "Vibration" => phase switch
                {
                    ScenarioPhase.Normal =>
                        Noisy(mid, range * 0.04), // ~2.25 mm/s (normal range [0.5, 4.0])

                    ScenarioPhase.Warning =>
                        // Ticks 7-14: Progress smoothly from 3.4 up to 4.30 mm/s (crosses max 4.0, warning range [4.0, 4.35])
                        Progressive(3.4, 4.30, tick - 6, 8, range * 0.015),

                    ScenarioPhase.Critical =>
                        // Ticks 15-24: Progress from 4.45 up to 5.50 mm/s (crosses critical threshold 4.35 mm/s)
                        Progressive(4.45, 5.50, tick - 14, 10, range * 0.02),

                    ScenarioPhase.Failure =>
                        // Ticks 25-32: High extreme vibration peak 5.6 - 6.0 mm/s
                        Noisy(5.8, range * 0.03),

                    ScenarioPhase.Recovery =>
                        // Ticks 33-42: Gradually cool down from 4.8 down to 2.25 mm/s
                        Progressive(4.8, 2.25, tick - 32, 10, range * 0.02),

                    _ =>
                        // Nominal Restored: stable ~2.25 mm/s (Normal)
                        Noisy(mid, range * 0.03)
                },

                "Temperature" => phase switch
                {
                    ScenarioPhase.Normal          => Noisy(55.0, 2.0),
                    ScenarioPhase.Warning         => Progressive(60.0, 85.0, tick - 6, 8, 1.5),
                    ScenarioPhase.Critical        => Progressive(88.0, 102.0, tick - 14, 10, 1.5),
                    ScenarioPhase.Failure         => Noisy(105.0, 2.0),
                    ScenarioPhase.Recovery        => Progressive(95.0, 56.0, tick - 32, 10, 2.0),
                    _                             => Noisy(55.0, 1.5)
                },

                "Speed" => phase switch
                {
                    ScenarioPhase.Normal          => Noisy(800.0, 10.0),
                    ScenarioPhase.Warning         => Progressive(800.0, 750.0, tick - 6, 8, 10.0),
                    ScenarioPhase.Critical        => Progressive(750.0, 450.0, tick - 14, 10, 15.0),
                    ScenarioPhase.Failure         => Noisy(80.0, 15.0),
                    ScenarioPhase.Recovery        => Progressive(200.0, 780.0, tick - 32, 10, 15.0),
                    _                             => Noisy(800.0, 8.0)
                },

                _ => GenerateNormal(min, max) // Other sensors on CR-001 stay healthy
            };
        }

        // All other machines (RW-001, CV-001, RE-001): stay normal and RUNNING throughout
        return GenerateNormal(min, max);
    }

    private static double Progressive(double start, double target, int currentStep, int totalSteps, double noise)
    {
        var clampedStep = Math.Clamp(currentStep, 0, totalSteps);
        var progress = (double)clampedStep / totalSteps;
        var baseValue = start + (target - start) * progress;
        return Noisy(baseValue, noise);
    }

    private static double GenerateNormal(double min, double max)
    {
        var mid = (min + max) / 2.0;
        var range = max - min;
        return Noisy(mid, range * 0.04);
    }

    private static double Noisy(double value, double noise)
    {
        var jitter = ((_rng.NextDouble() * 2) - 1) * noise;
        return Math.Round(value + jitter, 2);
    }

    public enum ScenarioPhase
    {
        Normal,
        Warning,
        Critical,
        Failure,
        Recovery,
        NominalRestored
    }
}