using DigitalTwin.Application.Services;
using DigitalTwin.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace DigitalTwin.Domain.Tests.Services;

public class AnomalyDetectionServiceTests
{
    private readonly AnomalyDetectionService _service = new();

    [Fact]
    public void Evaluate_ShouldReturnNormal_WhenNoThresholdsConfigured()
    {
        var result = _service.Evaluate(150.0, null, null, "TEMP-01");

        result.IsAnomaly.Should().BeFalse();
        result.Severity.Should().BeNull();
        result.DeviationPercent.Should().Be(0);
    }

    [Theory]
    [InlineData(20.0, 10.0, 80.0)] // mid range
    [InlineData(10.0, 10.0, 80.0)] // exactly min
    [InlineData(80.0, 10.0, 80.0)] // exactly max
    public void Evaluate_ShouldReturnNormal_WhenValueIsWithinThresholds(double value, double min, double max)
    {
        var result = _service.Evaluate(value, min, max, "TEMP-01");

        result.IsAnomaly.Should().BeFalse();
        result.Severity.Should().BeNull();
        result.DeviationPercent.Should().Be(0);
    }

    [Fact]
    public void Evaluate_ShouldReturnWarning_WhenValueSlightlyExceedsMax()
    {
        // Range width = 80 - 10 = 70. 10% of 70 = 7.0.
        // Value 85.0 is 5.0 above max (7.14% deviation <= 10%).
        var result = _service.Evaluate(85.0, 10.0, 80.0, "TEMP-01");

        result.IsAnomaly.Should().BeTrue();
        result.Severity.Should().Be(AlertSeverity.Warning);
        result.DeviationPercent.Should().BeApproximately(7.14, 0.01);
    }

    [Fact]
    public void Evaluate_ShouldReturnCritical_WhenValueSignificantlyExceedsMax()
    {
        // Range width = 70. 10% = 7.0.
        // Value 90.0 is 10.0 above max (14.28% deviation > 10%).
        var result = _service.Evaluate(90.0, 10.0, 80.0, "TEMP-01");

        result.IsAnomaly.Should().BeTrue();
        result.Severity.Should().Be(AlertSeverity.Critical);
        result.DeviationPercent.Should().BeApproximately(14.28, 0.01);
    }

    [Fact]
    public void Evaluate_ShouldReturnWarning_WhenValueSlightlyBelowMin()
    {
        // Range width = 70. Value 5.0 is 5.0 below min (7.14% deviation <= 10%).
        var result = _service.Evaluate(5.0, 10.0, 80.0, "TEMP-01");

        result.IsAnomaly.Should().BeTrue();
        result.Severity.Should().Be(AlertSeverity.Warning);
        result.DeviationPercent.Should().BeApproximately(7.14, 0.01);
    }

    [Fact]
    public void Evaluate_ShouldReturnCritical_WhenValueSignificantlyBelowMin()
    {
        // Range width = 70. Value -10.0 is 20.0 below min (28.57% deviation > 10%).
        var result = _service.Evaluate(-10.0, 10.0, 80.0, "TEMP-01");

        result.IsAnomaly.Should().BeTrue();
        result.Severity.Should().Be(AlertSeverity.Critical);
        result.DeviationPercent.Should().BeApproximately(28.57, 0.01);
    }
}
