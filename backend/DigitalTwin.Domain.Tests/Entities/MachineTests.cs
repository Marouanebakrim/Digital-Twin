using DigitalTwin.Domain.Entities;
using DigitalTwin.Domain.Enums;
using DigitalTwin.Domain.Exceptions;
using FluentAssertions;

namespace DigitalTwin.Domain.Tests.Entities;

public class MachineTests
{
    // ── Helpers ──────────────────────────────────────────────────────────
    private static Machine BuildMachine(MachineStatus initialStatus = MachineStatus.Stopped)
    {
        var machine = new Machine(
            Guid.NewGuid(), "RW-001", "Roue-pelle", MachineType.Excavator,
            location: "Zone A", description: "Mining wheel");

        if (initialStatus == MachineStatus.Running)
            machine.ChangeStatus(MachineStatus.Running, "test setup");
        else if (initialStatus == MachineStatus.Maintenance)
            machine.ChangeStatus(MachineStatus.Maintenance, "test setup");

        return machine;
    }

    // ── Construction guards ───────────────────────────────────────────────

    [Fact]
    public void Constructor_WithValidParameters_CreatesMachineWithStoppedStatus()
    {
        var machine = BuildMachine();

        machine.Code.Should().Be("RW-001");
        machine.Name.Should().Be("Roue-pelle");
        machine.Type.Should().Be(MachineType.Excavator);
        machine.Status.Should().Be(MachineStatus.Stopped);
        machine.Sensors.Should().BeEmpty();
        machine.StateHistory.Should().BeEmpty();
    }

    [Fact]
    public void Constructor_WithEmptyProductionLineId_ThrowsDomainException()
    {
        var act = () => new Machine(Guid.Empty, "RW-001", "Roue-pelle", MachineType.Excavator);
        act.Should().Throw<DomainException>().WithMessage("*productionLineId*");
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    public void Constructor_WithBlankCode_ThrowsDomainException(string code)
    {
        var act = () => new Machine(Guid.NewGuid(), code, "Name", MachineType.Other);
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Constructor_WithCodeExceeding50Chars_ThrowsDomainException()
    {
        var longCode = new string('X', 51);
        var act = () => new Machine(Guid.NewGuid(), longCode, "Name", MachineType.Other);
        act.Should().Throw<DomainException>().WithMessage("*code*");
    }

    // ── ChangeStatus ─────────────────────────────────────────────────────

    [Fact]
    public void ChangeStatus_ToDifferentStatus_UpdatesStatusAndRecordsHistory()
    {
        var machine = BuildMachine(MachineStatus.Stopped);

        machine.ChangeStatus(MachineStatus.Running, "Manual start");

        machine.Status.Should().Be(MachineStatus.Running);
        machine.StateHistory.Should().HaveCount(1);
        machine.StateHistory[0].PreviousStatus.Should().Be(MachineStatus.Stopped);
        machine.StateHistory[0].NewStatus.Should().Be(MachineStatus.Running);
        machine.StateHistory[0].Reason.Should().Be("Manual start");
    }

    [Fact]
    public void ChangeStatus_ToSameStatus_IsNoOp()
    {
        var machine = BuildMachine(MachineStatus.Stopped);

        machine.ChangeStatus(MachineStatus.Stopped, "noop");

        machine.StateHistory.Should().BeEmpty();
        machine.DomainEvents.Should().BeEmpty();
    }

    [Fact]
    public void ChangeStatus_RaisesDomainEvent()
    {
        var machine = BuildMachine(MachineStatus.Stopped);
        machine.ClearDomainEvents(); // clear setup events

        machine.ChangeStatus(MachineStatus.Warning, "sensor threshold exceeded");

        machine.DomainEvents.Should().HaveCount(1);
        machine.DomainEvents[0].Should().BeOfType<Events.MachineStatusChangedEvent>();
    }

    // ── Start ─────────────────────────────────────────────────────────────

    [Fact]
    public void Start_FromStopped_SetsRunningStatus()
    {
        var machine = BuildMachine(MachineStatus.Stopped);
        machine.Start("operator");
        machine.Status.Should().Be(MachineStatus.Running);
    }

    [Fact]
    public void Start_WhenAlreadyRunning_ThrowsDomainException()
    {
        var machine = BuildMachine(MachineStatus.Running);
        var act = () => machine.Start();
        act.Should().Throw<DomainException>().WithMessage("*already running*");
    }

    [Fact]
    public void Start_WhenCritical_ThrowsDomainException()
    {
        var machine = BuildMachine(MachineStatus.Stopped);
        machine.ChangeStatus(MachineStatus.Critical, "force critical for test");

        var act = () => machine.Start();
        act.Should().Throw<DomainException>().WithMessage("*Critical*");
    }

    // ── Stop ──────────────────────────────────────────────────────────────

    [Fact]
    public void Stop_FromRunning_SetsStoppedStatus()
    {
        var machine = BuildMachine(MachineStatus.Running);
        machine.Stop("End of shift");
        machine.Status.Should().Be(MachineStatus.Stopped);
    }

    // ── EnterMaintenance ─────────────────────────────────────────────────

    [Fact]
    public void EnterMaintenance_FromAnyStatus_SetsMaintenance()
    {
        var machine = BuildMachine(MachineStatus.Running);
        machine.EnterMaintenance("Monthly inspection");
        machine.Status.Should().Be(MachineStatus.Maintenance);
    }

    // ── Update ────────────────────────────────────────────────────────────

    [Fact]
    public void Update_WithValidValues_UpdatesNameAndLocation()
    {
        var machine = BuildMachine();
        machine.Update("New Name", "Zone B", "Updated description");

        machine.Name.Should().Be("New Name");
        machine.Location.Should().Be("Zone B");
        machine.UpdatedAt.Should().NotBeNull();
    }

    // ── Machine does NOT expose sensor value properties ────────────────────

    [Fact]
    public void Machine_HasNoTemperatureProperty()
    {
        var machineType = typeof(Machine);
        machineType.GetProperty("Temperature").Should().BeNull(
            because: "Machine must not have direct sensor-value properties");
        machineType.GetProperty("Vibration").Should().BeNull(
            because: "Machine must not have direct sensor-value properties");
        machineType.GetProperty("Pressure").Should().BeNull(
            because: "Machine must not have direct sensor-value properties");
    }
}
