using DigitalTwin.Domain.Enums;

namespace DigitalTwin.Application.DTOs;

// ─── Plant ───────────────────────────────────────────────────────────────────

public record PlantDto(
    Guid Id,
    string Name,
    string Location,
    string? Description,
    DateTime CreatedAt,
    IEnumerable<ProductionLineDto> ProductionLines);

// ─── Production Line ─────────────────────────────────────────────────────────

public record ProductionLineDto(
    Guid Id,
    Guid PlantId,
    string Name,
    string? Description,
    IEnumerable<MachineSummaryDto> Machines);

// ─── Machine ─────────────────────────────────────────────────────────────────

public record MachineSummaryDto(
    Guid Id,
    string Code,
    string Name,
    string Type,
    string Status,
    int ActiveAlerts,
    int SensorCount);

public record MachineDetailDto(
    Guid Id,
    string Code,
    string Name,
    string Type,
    string Status,
    string? Description,
    string? Location,
    DateTime InstalledAt,
    DateTime CreatedAt,
    IEnumerable<SensorDto> Sensors,
    IEnumerable<MachineRelationDto> Relations);

public record CreateMachineDto(
    Guid ProductionLineId,
    string Code,
    string Name,
    MachineType Type,
    string? Location = null,
    string? Description = null);

public record UpdateMachineDto(
    string Name,
    string? Location = null,
    string? Description = null);

// ─── Sensor ──────────────────────────────────────────────────────────────────

public record SensorDto(
    Guid Id,
    Guid MachineId,
    string Code,
    string Name,
    string SensorType,
    string Unit,
    double? MinValue,
    double? MaxValue,
    double? MinWarning,
    double? MaxWarning,
    bool IsActive,
    SensorReadingDto? LatestReading);

public record CreateSensorDto(
    string Code,
    string Name,
    string SensorType,
    string Unit,
    double? MinValue = null,
    double? MaxValue = null);

// ─── Sensor Reading ──────────────────────────────────────────────────────────

public record SensorReadingDto(
    Guid Id,
    Guid SensorId,
    double Value,
    string Unit,
    DateTime Timestamp,
    string Quality,
    bool IsAnomaly);

public record SubmitReadingDto(
    double Value,
    DateTime? Timestamp = null);

// ─── Alert ───────────────────────────────────────────────────────────────────

public record AlertDto(
    Guid Id,
    Guid MachineId,
    string MachineName,
    string MachineCode,
    Guid? SensorId,
    string? SensorName,
    string Severity,
    string Type,
    string Title,
    string? Message,
    bool IsAcknowledged,
    DateTime? AcknowledgedAt,
    string? AcknowledgedBy,
    DateTime CreatedAt,
    DateTime? ResolvedAt);

public record AcknowledgeAlertDto(string AcknowledgedBy);

// ─── Machine Relation ────────────────────────────────────────────────────────

public record MachineRelationDto(
    Guid Id,
    Guid SourceMachineId,
    string SourceMachineCode,
    string SourceMachineName,
    Guid TargetMachineId,
    string TargetMachineCode,
    string TargetMachineName,
    string RelationType,
    string? Description);

public record CreateMachineRelationDto(
    Guid SourceMachineId,
    Guid TargetMachineId,
    MachineRelationType RelationType,
    string? Description = null);

// ─── Dashboard & Digital Twin ────────────────────────────────────────────────

public record DashboardSummaryDto(
    int TotalMachines,
    int Running,
    int Warning,
    int Critical,
    int Stopped,
    int ActiveAlerts,
    int CriticalAlerts,
    IEnumerable<MachineSummaryDto> Machines);

public record PlantTopologyDto(
    Guid PlantId,
    string PlantName,
    IEnumerable<MachineNodeDto> Nodes,
    IEnumerable<MachineRelationDto> Edges);

public record MachineNodeDto(
    Guid Id,
    string Code,
    string Name,
    string Type,
    string Status,
    int ActiveAlerts,
    Guid? ProductionLineId = null,
    string? ProductionLineName = null);

public record DigitalTwinStateDto(
    MachineDetailDto Machine,
    IEnumerable<SensorReadingDto> LatestReadings,
    IEnumerable<AlertDto> ActiveAlerts,
    IEnumerable<MachineStateHistoryDto> StatusHistory);

public record MachineStateHistoryDto(
    Guid Id,
    Guid MachineId,
    string PreviousStatus,
    string NewStatus,
    string? Reason,
    DateTime ChangedAt);

// ─── Simulator ───────────────────────────────────────────────────────────────

public record SimulatorStatusDto(
    bool IsRunning,
    string Mode,
    int IntervalMs,
    DateTime? StartedAt);

public record ChangeSimulatorModeDto(string Mode);

// ─── Digital Twin Engine ─────────────────────────────────────────────────────

/// <summary>
/// Current sensor reading snapshot for a single sensor.
/// </summary>
public record SensorCurrentValueDto(
    Guid SensorId,
    string SensorCode,
    string SensorName,
    string SensorType,
    string Unit,
    double Value,
    DateTime Timestamp,
    string Quality,
    bool IsAnomaly,
    string? Severity,
    double? MinValue,
    double? MaxValue);

/// <summary>
/// Aggregated current state of a machine:
/// dynamically built from the latest reading of each of its sensors.
/// No fixed property (Temperature, Pressure …) — 100% sensor-driven.
/// </summary>
public record CurrentMachineStateDto(
    Guid MachineId,
    string MachineCode,
    string MachineName,
    string MachineType,
    string Status,
    DateTime ComputedAt,
    IReadOnlyList<SensorCurrentValueDto> SensorValues,
    int ActiveAlertCount,
    int CriticalAlertCount);
