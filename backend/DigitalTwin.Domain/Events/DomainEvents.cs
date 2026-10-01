using DigitalTwin.Domain.Enums;
using MediatR;

namespace DigitalTwin.Domain.Events;

/// <summary>
/// Fired when a new sensor reading is successfully ingested.
/// Consumers: SignalR dispatcher, anomaly detector.
/// </summary>
public sealed record SensorReadingReceivedEvent(
    Guid          SensorId,
    Guid          MachineId,
    string        MachineCode,
    string        SensorCode,
    string        SensorType,
    string        Unit,
    double        Value,
    DateTime      Timestamp,
    ReadingQuality Quality,
    bool          IsAnomaly) : INotification;

/// <summary>
/// Fired when a machine transitions to a new operational status.
/// Consumers: SignalR dispatcher, dashboard aggregator.
/// </summary>
public sealed record MachineStatusChangedEvent(
    Guid          MachineId,
    string        MachineCode,
    MachineStatus PreviousStatus,
    MachineStatus NewStatus,
    string?       Reason) : INotification;

/// <summary>
/// Fired when a new alert is created.
/// Consumers: SignalR dispatcher, notification service.
/// </summary>
public sealed record AlertCreatedEvent(
    Guid          AlertId,
    Guid          MachineId,
    string        MachineCode,
    Guid?         SensorId,
    AlertSeverity Severity,
    AlertType     Type,
    string        Title,
    string?       Message,
    DateTime      CreatedAt) : INotification;

/// <summary>
/// Fired when an out-of-range reading is detected before an alert is raised.
/// Allows future consumers to do anomaly enrichment without coupling to Alert creation.
/// </summary>
public sealed record AnomalyDetectedEvent(
    Guid     SensorId,
    string   SensorCode,
    Guid     MachineId,
    string   MachineCode,
    double   Value,
    string   Unit,
    DateTime Timestamp) : INotification;
