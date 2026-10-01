using DigitalTwin.Domain.Common;
using DigitalTwin.Domain.Enums;
using DigitalTwin.Domain.Exceptions;

namespace DigitalTwin.Domain.Entities;

/// <summary>
/// An immutable time-series measurement produced by a sensor.
/// Once created a reading cannot be mutated (append-only log).
/// </summary>
public sealed class SensorReading : BaseEntity
{
    // ── Properties ───────────────────────────────────────────────────────
    public Guid          SensorId  { get; private set; }

    /// <summary>Raw measured value in the sensor's unit.</summary>
    public double        Value     { get; private set; }

    /// <summary>UTC instant at which the measurement was taken.</summary>
    public DateTime      Timestamp { get; private set; }

    /// <summary>Domain-evaluated quality at time of ingestion.</summary>
    public ReadingQuality Quality  { get; private set; }

    /// <summary>True when the value exceeded the sensor's min/max bounds.</summary>
    public bool IsAnomaly          { get; private set; }

    // ── Navigation ───────────────────────────────────────────────────────
    public Sensor Sensor { get; private set; } = null!;

    // ── EF Core ──────────────────────────────────────────────────────────
    private SensorReading() { }

    // ── Constructor ──────────────────────────────────────────────────────
    public SensorReading(
        Guid          sensorId,
        double        value,
        DateTime      timestamp,
        ReadingQuality quality,
        bool          isAnomaly)
    {
        DomainGuard.NotEmpty(sensorId, nameof(sensorId));

        if (double.IsNaN(value) || double.IsInfinity(value))
            throw new DomainException("Sensor reading value must be a finite number.");

        if (timestamp > DateTime.UtcNow.AddSeconds(30))
            throw new DomainException("Sensor reading timestamp cannot be more than 30 s in the future.");

        SensorId  = sensorId;
        Value     = value;
        Timestamp = timestamp;
        Quality   = quality;
        IsAnomaly = isAnomaly;
    }
}
