using DigitalTwin.Domain.Common;
using DigitalTwin.Domain.Enums;
using DigitalTwin.Domain.Exceptions;

namespace DigitalTwin.Domain.Entities;

/// <summary>
/// Immutable snapshot of a machine status transition.
/// Written once, never mutated — provides a full audit trail.
/// </summary>
public sealed class MachineStateHistory : BaseEntity
{
    public Guid          MachineId      { get; private set; }
    public MachineStatus PreviousStatus { get; private set; }
    public MachineStatus NewStatus      { get; private set; }
    public string?       Reason         { get; private set; }
    public DateTime      ChangedAt      { get; private set; }

    public Machine Machine { get; private set; } = null!;

    // ── EF Core ──────────────────────────────────────────────────────────
    private MachineStateHistory() { }

    public MachineStateHistory(
        Guid          machineId,
        MachineStatus previousStatus,
        MachineStatus newStatus,
        string?       reason)
    {
        DomainGuard.NotEmpty(machineId, nameof(machineId));

        MachineId      = machineId;
        PreviousStatus = previousStatus;
        NewStatus      = newStatus;
        Reason         = reason;
        ChangedAt      = DateTime.UtcNow;
    }
}
