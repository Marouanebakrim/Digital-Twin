using DigitalTwin.Domain.Entities;
using DigitalTwin.Domain.Enums;
using DigitalTwin.Domain.Exceptions;
using FluentAssertions;

namespace DigitalTwin.Domain.Tests.Entities;

public class SensorReadingTests
{
    private static SensorReading BuildReading(double value = 75.5, DateTime? timestamp = null)
        => new(Guid.NewGuid(), value, timestamp ?? DateTime.UtcNow, ReadingQuality.Good, false);

    // ── Construction guards ───────────────────────────────────────────────

    [Fact]
    public void Constructor_WithValidParameters_CreatesReading()
    {
        var ts      = DateTime.UtcNow;
        var reading = new SensorReading(Guid.NewGuid(), 42.0, ts, ReadingQuality.Good, false);

        reading.Value.Should().Be(42.0);
        reading.Timestamp.Should().Be(ts);
        reading.Quality.Should().Be(ReadingQuality.Good);
        reading.IsAnomaly.Should().BeFalse();
    }

    [Fact]
    public void Constructor_WithNaNValue_ThrowsDomainException()
    {
        var act = () => BuildReading(double.NaN);
        act.Should().Throw<DomainException>().WithMessage("*finite*");
    }

    [Fact]
    public void Constructor_WithPositiveInfinityValue_ThrowsDomainException()
    {
        var act = () => BuildReading(double.PositiveInfinity);
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Constructor_WithNegativeInfinityValue_ThrowsDomainException()
    {
        var act = () => BuildReading(double.NegativeInfinity);
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Constructor_WithFarFutureTimestamp_ThrowsDomainException()
    {
        var futureTs = DateTime.UtcNow.AddMinutes(5);
        var act = () => BuildReading(timestamp: futureTs);
        act.Should().Throw<DomainException>().WithMessage("*future*");
    }

    [Fact]
    public void Constructor_WithEmptySensorId_ThrowsDomainException()
    {
        var act = () => new SensorReading(Guid.Empty, 50.0, DateTime.UtcNow, ReadingQuality.Good, false);
        act.Should().Throw<DomainException>().WithMessage("*sensorId*");
    }

    [Fact]
    public void Constructor_WithNearFutureTimestampWithinTolerance_Succeeds()
    {
        // 10 seconds in the future is within the 30 s tolerance
        var nearFuture = DateTime.UtcNow.AddSeconds(10);
        var act = () => BuildReading(timestamp: nearFuture);
        act.Should().NotThrow();
    }
}
