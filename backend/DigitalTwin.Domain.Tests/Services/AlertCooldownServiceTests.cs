using DigitalTwin.Application.Services;
using DigitalTwin.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace DigitalTwin.Domain.Tests.Services;

public class AlertCooldownServiceTests
{
    [Fact]
    public void ShouldRaiseAlert_ShouldReturnTrue_FirstTimeAlertIsRaised()
    {
        var cooldown = new AlertCooldownService(TimeSpan.FromMinutes(5));
        var sensorId = Guid.NewGuid();

        bool result = cooldown.ShouldRaiseAlert(sensorId, AlertSeverity.Warning);

        result.Should().BeTrue();
    }

    [Fact]
    public void ShouldRaiseAlert_ShouldReturnFalse_WhenSameSeverityRaisedWithinCooldown()
    {
        var cooldown = new AlertCooldownService(TimeSpan.FromMinutes(5));
        var sensorId = Guid.NewGuid();

        cooldown.ShouldRaiseAlert(sensorId, AlertSeverity.Warning);
        bool secondCall = cooldown.ShouldRaiseAlert(sensorId, AlertSeverity.Warning);

        secondCall.Should().BeFalse();
    }

    [Fact]
    public void ShouldRaiseAlert_ShouldReturnTrue_WhenSeverityEscalatesToCritical()
    {
        var cooldown = new AlertCooldownService(TimeSpan.FromMinutes(5));
        var sensorId = Guid.NewGuid();

        cooldown.ShouldRaiseAlert(sensorId, AlertSeverity.Warning);
        bool escalatedCall = cooldown.ShouldRaiseAlert(sensorId, AlertSeverity.Critical);

        escalatedCall.Should().BeTrue();
    }

    [Fact]
    public void ShouldRaiseAlert_ShouldReturnTrue_AfterReset()
    {
        var cooldown = new AlertCooldownService(TimeSpan.FromMinutes(5));
        var sensorId = Guid.NewGuid();

        cooldown.ShouldRaiseAlert(sensorId, AlertSeverity.Warning);
        cooldown.Reset(sensorId);

        bool postResetCall = cooldown.ShouldRaiseAlert(sensorId, AlertSeverity.Warning);

        postResetCall.Should().BeTrue();
    }

    [Fact]
    public void ShouldRaiseAlert_ShouldReturnTrue_AfterCooldownExpires()
    {
        // 50ms cooldown window for fast test execution
        var cooldown = new AlertCooldownService(TimeSpan.FromMilliseconds(50));
        var sensorId = Guid.NewGuid();

        cooldown.ShouldRaiseAlert(sensorId, AlertSeverity.Warning);
        Thread.Sleep(60);

        bool postExpiryCall = cooldown.ShouldRaiseAlert(sensorId, AlertSeverity.Warning);

        postExpiryCall.Should().BeTrue();
    }
}
