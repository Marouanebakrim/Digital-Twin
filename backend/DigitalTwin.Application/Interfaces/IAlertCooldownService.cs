using DigitalTwin.Domain.Enums;

namespace DigitalTwin.Application.Interfaces;

/// <summary>
/// Tracks recently-raised alerts per sensor to prevent alert flooding.
///
/// Rule: an alert for a given (sensor, severity) pair is suppressed
/// if another alert of the same or higher severity was already raised
/// within the cooldown window.
///
/// Implementations can be in-memory (singleton) or backed by a distributed cache.
/// </summary>
public interface IAlertCooldownService
{
    /// <summary>
    /// Returns true if a new alert should be raised for this sensor / severity combination.
    /// Internally records the timestamp when returning true.
    /// </summary>
    bool ShouldRaiseAlert(Guid sensorId, AlertSeverity severity);

    /// <summary>
    /// Resets the cooldown for a sensor (e.g. when the value returns to normal).
    /// </summary>
    void Reset(Guid sensorId);
}
