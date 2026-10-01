using DigitalTwin.Application.Interfaces;
using DigitalTwin.Domain.Enums;

namespace DigitalTwin.Application.Services;

/// <summary>
/// Stateless anomaly detection with 3-level severity classification.
///
/// Severity rules (sensor-relative, using MinValue/MaxValue as the normal band):
///
///   ┌───────────────────────────────────────────────────────┐
///   │  Normal   │ min ≤ value ≤ max                         │
///   │  Warning  │ value deviated ≤ WarningPercent  (10%)    │
///   │  Critical │ value deviated  > WarningPercent  (10%)   │
///   └───────────────────────────────────────────────────────┘
///
/// When no threshold is configured the reading is always Normal.
/// </summary>
public sealed class AnomalyDetectionService : IAnomalyDetectionService
{
    /// <summary>
    /// Deviation beyond which a Warning is escalated to Critical.
    /// Expressed as a fraction of the normal range width (0.10 = 10%).
    /// </summary>
    private const double CriticalDeviationFactor = 0.10;

    public AnomalyResult Evaluate(
        double value,
        double? minValue,
        double? maxValue,
        string sensorCode)
    {
        // No thresholds → always Normal
        if (!minValue.HasValue && !maxValue.HasValue)
            return new AnomalyResult(false, null, 0);

        double rangeWidth = (maxValue ?? double.MaxValue) - (minValue ?? double.MinValue);
        double deviationPercent = 0;
        bool isAnomaly = false;

        if (maxValue.HasValue && value > maxValue.Value)
        {
            isAnomaly = true;
            deviationPercent = rangeWidth > 0
                ? (value - maxValue.Value) / rangeWidth * 100
                : double.MaxValue;
        }
        else if (minValue.HasValue && value < minValue.Value)
        {
            isAnomaly = true;
            deviationPercent = rangeWidth > 0
                ? (minValue.Value - value) / rangeWidth * 100
                : double.MaxValue;
        }

        if (!isAnomaly)
            return new AnomalyResult(false, null, 0);

        // Map deviation to severity
        var severity = deviationPercent > CriticalDeviationFactor * 100
            ? AlertSeverity.Critical
            : AlertSeverity.Warning;

        return new AnomalyResult(true, severity, deviationPercent);
    }
}
