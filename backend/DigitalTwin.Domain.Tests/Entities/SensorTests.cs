using DigitalTwin.Domain.Entities;
using DigitalTwin.Domain.Enums;
using DigitalTwin.Domain.Exceptions;
using FluentAssertions;

namespace DigitalTwin.Domain.Tests.Entities;

public class SensorTests
{
    // ── Helpers ──────────────────────────────────────────────────────────
    private static Sensor BuildSensor(double? min = 10, double? max = 100)
        => new(Guid.NewGuid(), "TST-001-TEMP", "Temperature", "Temperature", "°C", min, max);

    // ── Construction guards ───────────────────────────────────────────────

    [Fact]
    public void Constructor_WithValidParameters_CreatesActiveSensor()
    {
        var sensor = BuildSensor();

        sensor.Code.Should().Be("TST-001-TEMP");
        sensor.IsActive.Should().BeTrue();
        sensor.MinValue.Should().Be(10);
        sensor.MaxValue.Should().Be(100);
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData(null!)]
    public void Constructor_WithBlankCode_ThrowsDomainException(string? code)
    {
        var act = () => new Sensor(Guid.NewGuid(), code!, "Name", "Temperature", "°C");
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Constructor_WithEmptyMachineId_ThrowsDomainException()
    {
        var act = () => new Sensor(Guid.Empty, "CODE", "Name", "Temperature", "°C");
        act.Should().Throw<DomainException>().WithMessage("*machineId*");
    }

    [Fact]
    public void Constructor_WhenMinValueGreaterThanMaxValue_ThrowsDomainException()
    {
        var act = () => BuildSensor(min: 100, max: 10);
        act.Should().Throw<DomainException>().WithMessage("*MinValue must be less than MaxValue*");
    }

    [Fact]
    public void Constructor_WhenMinValueEqualsMaxValue_ThrowsDomainException()
    {
        var act = () => BuildSensor(min: 50, max: 50);
        act.Should().Throw<DomainException>();
    }

    // ── EvaluateQuality ───────────────────────────────────────────────────

    [Fact]
    public void EvaluateQuality_WhenValueInsideRange_ReturnsGood()
    {
        var sensor = BuildSensor(min: 10, max: 100);
        sensor.EvaluateQuality(55).Should().Be(ReadingQuality.Good);
    }

    [Fact]
    public void EvaluateQuality_WhenValueAtMinBoundary_ReturnsGood()
    {
        var sensor = BuildSensor(min: 10, max: 100);
        sensor.EvaluateQuality(10).Should().Be(ReadingQuality.Good);
    }

    [Fact]
    public void EvaluateQuality_WhenValueAtMaxBoundary_ReturnsGood()
    {
        var sensor = BuildSensor(min: 10, max: 100);
        sensor.EvaluateQuality(100).Should().Be(ReadingQuality.Good);
    }

    [Fact]
    public void EvaluateQuality_WhenValueBelowMin_ReturnsBad()
    {
        var sensor = BuildSensor(min: 10, max: 100);
        sensor.EvaluateQuality(9.9).Should().Be(ReadingQuality.Bad);
    }

    [Fact]
    public void EvaluateQuality_WhenValueAboveMax_ReturnsBad()
    {
        var sensor = BuildSensor(min: 10, max: 100);
        sensor.EvaluateQuality(100.1).Should().Be(ReadingQuality.Bad);
    }

    [Fact]
    public void EvaluateQuality_WhenNoThresholdsConfigured_AlwaysReturnsGood()
    {
        var sensor = BuildSensor(min: null, max: null);
        sensor.EvaluateQuality(-9999).Should().Be(ReadingQuality.Good);
        sensor.EvaluateQuality(9999).Should().Be(ReadingQuality.Good);
    }

    // ── IsOutOfRange ──────────────────────────────────────────────────────

    [Theory]
    [InlineData(55,    false)]
    [InlineData(9.9,   true)]
    [InlineData(100.1, true)]
    public void IsOutOfRange_ReturnsExpectedResult(double value, bool expected)
    {
        var sensor = BuildSensor(10, 100);
        sensor.IsOutOfRange(value).Should().Be(expected);
    }

    // ── UpdateThresholds ──────────────────────────────────────────────────

    [Fact]
    public void UpdateThresholds_WithValidRange_UpdatesValues()
    {
        var sensor = BuildSensor(10, 100);
        sensor.UpdateThresholds(20, 80);

        sensor.MinValue.Should().Be(20);
        sensor.MaxValue.Should().Be(80);
        sensor.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public void UpdateThresholds_WhenMinGreaterThanMax_ThrowsDomainException()
    {
        var sensor = BuildSensor(10, 100);
        var act = () => sensor.UpdateThresholds(90, 20);
        act.Should().Throw<DomainException>();
    }

    // ── Activate / Deactivate ─────────────────────────────────────────────

    [Fact]
    public void Deactivate_SetsIsActiveFalse()
    {
        var sensor = BuildSensor();
        sensor.Deactivate();
        sensor.IsActive.Should().BeFalse();
    }

    [Fact]
    public void Activate_AfterDeactivation_SetsIsActiveTrue()
    {
        var sensor = BuildSensor();
        sensor.Deactivate();
        sensor.Activate();
        sensor.IsActive.Should().BeTrue();
    }
}
