using DigitalTwin.Application.DTOs;

namespace DigitalTwin.Application.Interfaces;

/// <summary>
/// Core Digital Twin processing engine.
///
/// Processes an incoming sensor reading end-to-end:
///   1. Persists the reading
///   2. Evaluates quality / anomaly via IAnomalyDetectionService
///   3. Raises alerts (Warning or Critical) with cooldown deduplication
///   4. Updates the machine status
///   5. Records MachineStateHistory
///   6. Dispatches real-time SignalR events ONLY after successful commit
/// </summary>
public interface IDigitalTwinEngine
{
    Task<SensorReadingDto> ProcessReadingAsync(
        Guid sensorId,
        double value,
        DateTime? timestamp = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Reconstructs the current state of a machine from its latest per-sensor readings.
    /// </summary>
    Task<CurrentMachineStateDto> GetCurrentStateAsync(
        Guid machineId,
        CancellationToken cancellationToken = default);
}
