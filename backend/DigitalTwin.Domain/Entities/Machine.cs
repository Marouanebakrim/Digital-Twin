using DigitalTwin.Domain.Common;
using DigitalTwin.Domain.Enums;
using DigitalTwin.Domain.Events;
using DigitalTwin.Domain.Exceptions;

namespace DigitalTwin.Domain.Entities;

/// <summary>
/// Aggregate root for an industrial machine.
///
/// ⚠ DESIGN RULE: Machine does NOT contain any direct sensor-value properties
/// (Temperature, Vibration, Pressure …).  All physical measurements are
/// stored in the dynamic <see cref="Sensors"/> collection.
/// </summary>
public sealed class Machine : AggregateRoot
{
    // ── Backing collections ───────────────────────────────────────────────
    private readonly List<Sensor>              _sensors      = [];
    private readonly List<Alert>               _alerts       = [];
    private readonly List<MachineStateHistory> _stateHistory = [];
    private readonly List<MachineRelation>     _relationsOut = []; // source → target
    private readonly List<MachineRelation>     _relationsIn  = []; // target ← source

    // ── Properties ───────────────────────────────────────────────────────
    /// <summary>Unique business code, e.g. "RW-001".</summary>
    public string Code { get; private set; } = string.Empty;

    /// <summary>Human-readable name, e.g. "Roue-pelle".</summary>
    public string Name { get; private set; } = string.Empty;

    public MachineType   Type     { get; private set; }
    public MachineStatus Status   { get; private set; } = MachineStatus.Stopped;
    public string?       Location { get; private set; }
    public string?       Description { get; private set; }
    public DateTime      InstalledAt { get; private set; }

    public Guid ProductionLineId { get; private set; }

    // ── Navigation ───────────────────────────────────────────────────────
    public ProductionLine ProductionLine { get; private set; } = null!;

    /// <summary>
    /// Dynamic sensor collection.
    /// Each sensor carries its own Name, SensorType, Unit and thresholds.
    /// </summary>
    public IReadOnlyList<Sensor> Sensors => _sensors.AsReadOnly();

    public IReadOnlyList<Alert>               Alerts       => _alerts.AsReadOnly();
    public IReadOnlyList<MachineStateHistory> StateHistory => _stateHistory.AsReadOnly();

    /// <summary>Relations where this machine is the source (e.g. RW-001 → CR-001).</summary>
    public IReadOnlyList<MachineRelation> RelationsOut => _relationsOut.AsReadOnly();

    /// <summary>Relations where this machine is the target (e.g. … → RW-001).</summary>
    public IReadOnlyList<MachineRelation> RelationsIn  => _relationsIn.AsReadOnly();

    // ── EF Core ──────────────────────────────────────────────────────────
    private Machine() { }

    // ── Constructor ──────────────────────────────────────────────────────
    public Machine(
        Guid         productionLineId,
        string       code,
        string       name,
        MachineType  type,
        string?      location    = null,
        string?      description = null,
        DateTime?    installedAt = null)
    {
        DomainGuard.NotEmpty(productionLineId,      nameof(productionLineId));
        DomainGuard.NotNullOrWhiteSpace(code, nameof(code));
        DomainGuard.NotNullOrWhiteSpace(name, nameof(name));
        DomainGuard.MaxLength(code, 50,  nameof(code));
        DomainGuard.MaxLength(name, 200, nameof(name));

        Id               = Guid.NewGuid();
        ProductionLineId = productionLineId;
        Code             = code;
        Name             = name;
        Type             = type;
        Location         = location;
        Description      = description;
        InstalledAt      = installedAt ?? DateTime.UtcNow;
        Status           = MachineStatus.Stopped;
    }

    // ── Behaviour ────────────────────────────────────────────────────────

    /// <summary>
    /// Transitions the machine to a new operational status.
    /// Records history and raises a <see cref="MachineStatusChangedEvent"/>.
    /// Transition to the same status is a no-op.
    /// </summary>
    public void ChangeStatus(MachineStatus newStatus, string reason)
    {
        if (Status == newStatus) return;

        var previous = Status;
        Status = newStatus;
        MarkUpdated();

        var history = new MachineStateHistory(Id, previous, newStatus, reason);
        _stateHistory.Add(history);

        RaiseDomainEvent(new MachineStatusChangedEvent(Id, Code, previous, newStatus, reason));
    }

    /// <summary>Start the machine (must be Stopped or Maintenance).</summary>
    public void Start(string startedBy = "system")
    {
        if (Status == MachineStatus.Running)
            throw new DomainException($"Machine {Code} is already running.");

        if (Status == MachineStatus.Critical)
            throw new DomainException($"Cannot start machine {Code} while in Critical status. Resolve alerts first.");

        ChangeStatus(MachineStatus.Running, $"Started by {startedBy}");
    }

    /// <summary>Stop the machine.</summary>
    public void Stop(string reason = "Manual stop")
        => ChangeStatus(MachineStatus.Stopped, reason);

    /// <summary>Put machine in maintenance mode.</summary>
    public void EnterMaintenance(string reason = "Scheduled maintenance")
        => ChangeStatus(MachineStatus.Maintenance, reason);

    public void Update(string name, string? location, string? description)
    {
        DomainGuard.NotNullOrWhiteSpace(name, nameof(name));
        DomainGuard.MaxLength(name, 200,      nameof(name));

        Name        = name;
        Location    = location;
        Description = description;
        MarkUpdated();
    }
}
