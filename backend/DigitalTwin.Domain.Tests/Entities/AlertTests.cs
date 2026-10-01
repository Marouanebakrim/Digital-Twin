using DigitalTwin.Domain.Entities;
using DigitalTwin.Domain.Enums;
using DigitalTwin.Domain.Exceptions;
using FluentAssertions;

namespace DigitalTwin.Domain.Tests.Entities;

public class AlertTests
{
    private static Alert BuildAlert(AlertSeverity severity = AlertSeverity.Warning)
        => new(Guid.NewGuid(), Guid.NewGuid(), severity, AlertType.SensorThreshold,
               "Threshold exceeded", "Temperature above 100°C");

    // ── Construction ─────────────────────────────────────────────────────

    [Fact]
    public void Constructor_WithValidParameters_CreatesOpenAlert()
    {
        var alert = BuildAlert();

        alert.IsAcknowledged.Should().BeFalse();
        alert.IsResolved.Should().BeFalse();
        alert.IsOpen.Should().BeTrue();
        alert.AcknowledgedAt.Should().BeNull();
        alert.ResolvedAt.Should().BeNull();
    }

    [Fact]
    public void Constructor_WithEmptyMachineId_ThrowsDomainException()
    {
        var act = () => new Alert(Guid.Empty, null, AlertSeverity.Warning,
                                  AlertType.MachineDown, "title");
        act.Should().Throw<DomainException>().WithMessage("*machineId*");
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    public void Constructor_WithBlankTitle_ThrowsDomainException(string title)
    {
        var act = () => new Alert(Guid.NewGuid(), null, AlertSeverity.Warning,
                                  AlertType.MachineDown, title);
        act.Should().Throw<DomainException>();
    }

    // ── Acknowledge ───────────────────────────────────────────────────────

    [Fact]
    public void Acknowledge_FirstTime_SetsAcknowledgedFields()
    {
        var alert = BuildAlert();
        alert.Acknowledge("operator1");

        alert.IsAcknowledged.Should().BeTrue();
        alert.AcknowledgedBy.Should().Be("operator1");
        alert.AcknowledgedAt.Should().NotBeNull();
        alert.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public void Acknowledge_SecondTime_ThrowsDomainException()
    {
        var alert = BuildAlert();
        alert.Acknowledge("operator1");

        var act = () => alert.Acknowledge("operator2");
        act.Should().Throw<DomainException>().WithMessage("*already acknowledged*");
    }

    [Fact]
    public void Acknowledge_AfterResolve_ThrowsDomainException()
    {
        var alert = BuildAlert();
        alert.Resolve();

        var act = () => alert.Acknowledge("operator1");
        act.Should().Throw<DomainException>().WithMessage("*resolved*");
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    public void Acknowledge_WithBlankUser_ThrowsDomainException(string user)
    {
        var alert = BuildAlert();
        var act = () => alert.Acknowledge(user);
        act.Should().Throw<DomainException>();
    }

    // ── Resolve ───────────────────────────────────────────────────────────

    [Fact]
    public void Resolve_FirstTime_SetsResolvedAt()
    {
        var alert = BuildAlert();
        alert.Resolve();

        alert.IsResolved.Should().BeTrue();
        alert.ResolvedAt.Should().NotBeNull();
        alert.IsOpen.Should().BeFalse();
    }

    [Fact]
    public void Resolve_SecondTime_ThrowsDomainException()
    {
        var alert = BuildAlert();
        alert.Resolve();

        var act = () => alert.Resolve();
        act.Should().Throw<DomainException>().WithMessage("*already resolved*");
    }

    // ── Severity ──────────────────────────────────────────────────────────

    [Theory]
    [InlineData(AlertSeverity.Info)]
    [InlineData(AlertSeverity.Warning)]
    [InlineData(AlertSeverity.Critical)]
    public void Constructor_AcceptsAllSeverityLevels(AlertSeverity severity)
    {
        var act = () => BuildAlert(severity);
        act.Should().NotThrow();
    }
}
