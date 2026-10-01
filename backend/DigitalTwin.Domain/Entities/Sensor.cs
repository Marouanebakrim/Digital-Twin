using DigitalTwin.Domain.Common;
using DigitalTwin.Domain.Enums;
using DigitalTwin.Domain.Exceptions;

namespace DigitalTwin.Domain.Entities;

/// <summary>
/// Physical sensor attached to a machine.
///
/// Key design points:
/// • <see cref="SensorType"/> is stored as a <c>string</c> in the database,
///   enabling new sensor types without schema migrations.
/// • The <see cref="SensorType"/> enum provides well-known names for the demo plant.
/// • Threshold evaluation is pure domain logic with no infrastructure dependency.
/// </summary>
public sealed class Sensor : BaseEntity
{
    private readonly List<SensorReading> _readings = [];

    // ── Properties ───────────────────────────────────────────────────────
    public Guid   MachineId  { get; private set; }

    /// <summary>Unique business code, e.g. "RW-001-TEMP".</summary>
    public string Code       { get; private set; } = string.Empty;

    /// <summary>Human-readable name, e.g. "Temperature".</summary>
    public string Name       { get; private set; } = string.Empty;

    /// <summary>
    /// Free-form string that classifies the sensor ("Temperature", "Vibration", "PH" …).
    /// Matches <see cref="SensorType"/> names but is deliberately stored as a string
    /// so that new types can be added without code changes.
    /// </summary>
    public string SensorType { get; private set; } = string.Empty;

    /// <summary>Unit of measure, e.g. "°C", "mm/s", "RPM", "%".</summary>
    public string Unit        { get; private set; } = string.Empty;

    /// <summary>Lower bound of the normal operating range.</summary>
    public double? MinValue  { get; private set; }

    /// <summary>Upper bound of the normal operating range.</summary>
    public double? MaxValue  { get; private set; }

    /// <summary>When true this sensor actively produces readings.</summary>
    public bool IsActive     { get; private set; } = true;

    // ── Navigation ───────────────────────────────────────────────────────
    public Machine Machine { get; private set; } = null!;

    /// <summary>Time-series readings for this sensor.</summary>
    public IReadOnlyList<SensorReading> Readings => _readings.AsReadOnly();

    // ── EF Core ──────────────────────────────────────────────────────────
    private Sensor() { }

    // ── Constructor ──────────────────────────────────────────────────────
    public Sensor(
        Guid    machineId,
        string  code,
        string  name,
        string  sensorType,
        string  unit,
        double? minValue = null,
        double? maxValue = null)
    {
        DomainGuard.NotEmpty(machineId,              nameof(machineId));
        DomainGuard.NotNullOrWhiteSpace(code,       nameof(code));
        DomainGuard.NotNullOrWhiteSpace(name,       nameof(name));
        DomainGuard.NotNullOrWhiteSpace(sensorType, nameof(sensorType));
        DomainGuard.NotNullOrWhiteSpace(unit,       nameof(unit));
        DomainGuard.MaxLength(code, 50,             nameof(code));
        DomainGuard.MaxLength(name, 100,            nameof(name));

        if (minValue.HasValue && maxValue.HasValue && minValue >= maxValue)
            throw new DomainException($"Sensor '{code}': MinValue must be less than MaxValue.");

        Id         = Guid.NewGuid();
        MachineId  = machineId;
        Code       = code;
        Name       = name;
        SensorType = sensorType;
        Unit       = unit;
        MinValue   = minValue;
        MaxValue   = maxValue;
    }

    // ── Domain behaviour ─────────────────────────────────────────────────

    /// <summary>
    /// Evaluates the quality of a raw sensor value against the configured thresholds.
    /// </summary>
    public ReadingQuality EvaluateQuality(double value)
    {
        if (MinValue.HasValue && value < MinValue.Value) return ReadingQuality.Bad;
        if (MaxValue.HasValue && value > MaxValue.Value) return ReadingQuality.Bad;
        return ReadingQuality.Good;
    }

    /// <summary>Returns true when the value exceeds the min/max boundaries.</summary>
    public bool IsOutOfRange(double value)
        => EvaluateQuality(value) == ReadingQuality.Bad;

    /// <summary>Updates the normal-range thresholds. MinValue must be &lt; MaxValue.</summary>
    public void UpdateThresholds(double? minValue, double? maxValue)
    {
        if (minValue.HasValue && maxValue.HasValue && minValue >= maxValue)
            throw new DomainException($"Sensor '{Code}': MinValue must be less than MaxValue.");

        MinValue = minValue;
        MaxValue = maxValue;
        MarkUpdated();
    }

    public void Activate()   { IsActive = true;  MarkUpdated(); }
    public void Deactivate() { IsActive = false; MarkUpdated(); }
}
