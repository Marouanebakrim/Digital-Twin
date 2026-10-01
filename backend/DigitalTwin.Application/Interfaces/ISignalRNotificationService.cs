using DigitalTwin.Application.DTOs;

namespace DigitalTwin.Application.Interfaces;

/// <summary>
/// Abstraction for real-time SignalR notifications.
/// Dispatches domain and telemetry events to connected frontend clients.
/// </summary>
public interface ISignalRNotificationService
{
    /// <summary>
    /// Dispatches 'SensorReadingUpdated' event containing complete telemetry payload:
    /// MachineId, MachineCode, SensorId, SensorType, Value, Unit, Timestamp, MachineStatus, AlertInfo.
    /// </summary>
    Task SendSensorReadingUpdatedAsync(
        SensorReadingUpdatePayload payload,
        CancellationToken cancellationToken = default);

    /// <summary>Dispatches 'MachineStateUpdated' event containing current dynamic machine state.</summary>
    Task SendMachineStateUpdatedAsync(
        CurrentMachineStateDto state,
        CancellationToken cancellationToken = default);

    /// <summary>Dispatches 'MachineStatusChanged' event when machine transitions status.</summary>
    Task SendMachineStatusChangedAsync(
        Guid machineId, string machineCode, string previousStatus, string newStatus, string? reason,
        CancellationToken cancellationToken = default);

    /// <summary>Dispatches 'AlertCreated' event when a new alert is generated.</summary>
    Task SendAlertCreatedAsync(
        AlertDto alert,
        CancellationToken cancellationToken = default);

    /// <summary>Dispatches 'AlertAcknowledged' event.</summary>
    Task SendAlertAcknowledgedAsync(
        Guid alertId, DateTime acknowledgedAt, string acknowledgedBy,
        CancellationToken cancellationToken = default);

    /// <summary>Dispatches 'DashboardUpdated' KPI summary.</summary>
    Task SendDashboardUpdatedAsync(
        DashboardSummaryDto summary,
        CancellationToken cancellationToken = default);

    /// <summary>Dispatches 'PotentialImpactDetected' event when a critical failure impacts downstream machines.</summary>
    Task SendPotentialImpactDetectedAsync(
        ImpactAnalysisResultDto result,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Real-time SignalR payload for SensorReadingUpdated event.
/// </summary>
public record SensorReadingUpdatePayload(
    Guid MachineId,
    string MachineCode,
    Guid SensorId,
    string SensorType,
    double Value,
    string Unit,
    DateTime Timestamp,
    string MachineStatus,
    SensorReadingAlertInfo? AlertInfo);

public record SensorReadingAlertInfo(
    Guid AlertId,
    string Severity,
    string Title,
    string? Message);
