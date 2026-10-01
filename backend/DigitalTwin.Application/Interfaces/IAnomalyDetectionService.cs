using DigitalTwin.Domain.Enums;

namespace DigitalTwin.Application.Interfaces;

/// <summary>
/// Evaluates whether a sensor reading is anomalous and what severity it represents.
///
/// Design: fully stateless — uses Sensor thresholds (MinValue/MaxValue) plus
/// configurable warning margins to produce a 3-level result:
///   Normal   → value is within the normal operating band
///   Warning  → value exceeds normal band but is within a tolerable margin
///   Critical → value exceeds the tolerable margin
/// </summary>
public interface IAnomalyDetectionService
{
    AnomalyResult Evaluate(
        double value,
        double? minValue,
        double? maxValue,
        string sensorCode);
}

/// <summary>Immutable result of an anomaly evaluation.</summary>
/// <param name="IsAnomaly">True when the value is outside the normal band.</param>
/// <param name="Severity">Severity level of the deviation (null when IsAnomaly=false).</param>
/// <param name="DeviationPercent">
///   How far (in percent) the value is from the nearest threshold.
///   Positive = above MaxValue, negative = below MinValue, zero = within bounds.
/// </param>
public record AnomalyResult(
    bool IsAnomaly,
    AlertSeverity? Severity,
    double DeviationPercent);
