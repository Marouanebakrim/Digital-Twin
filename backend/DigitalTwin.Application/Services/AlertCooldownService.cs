using System.Collections.Concurrent;
using DigitalTwin.Application.Interfaces;
using DigitalTwin.Domain.Enums;

namespace DigitalTwin.Application.Services;

/// <summary>
/// Thread-safe, in-memory cooldown tracker.
/// Registered as Singleton so state survives across scoped requests.
///
/// Cooldown window (configurable via constructor, default 5 minutes):
///   After an alert is raised for sensor S at severity X,
///   a new alert for S is suppressed for CooldownDuration unless the
///   new reading has a HIGHER severity than the last raised alert.
///
/// Reset rule: when a sensor reading returns to Normal the cooldown is cleared,
/// allowing fresh alerts when the sensor degrades again.
/// </summary>
public sealed class AlertCooldownService : IAlertCooldownService
{
    private readonly TimeSpan _cooldownDuration;

    private readonly ConcurrentDictionary<Guid, CooldownEntry> _entries = new();

    public AlertCooldownService(TimeSpan? cooldownDuration = null)
    {
        _cooldownDuration = cooldownDuration ?? TimeSpan.FromMinutes(5);
    }

    public bool ShouldRaiseAlert(Guid sensorId, AlertSeverity severity)
    {
        var now = DateTime.UtcNow;

        if (_entries.TryGetValue(sensorId, out var existing))
        {
            // Within cooldown window?
            if (now - existing.RaisedAt < _cooldownDuration)
            {
                // Only allow escalation (Warning → Critical)
                if (severity <= existing.Severity)
                    return false;
            }
        }

        // Record this raise
        _entries[sensorId] = new CooldownEntry(severity, now);
        return true;
    }

    public void Reset(Guid sensorId)
        => _entries.TryRemove(sensorId, out _);

    private record CooldownEntry(AlertSeverity Severity, DateTime RaisedAt);
}
