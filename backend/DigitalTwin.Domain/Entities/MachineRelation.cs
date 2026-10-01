using DigitalTwin.Domain.Common;
using DigitalTwin.Domain.Enums;
using DigitalTwin.Domain.Exceptions;

namespace DigitalTwin.Domain.Entities;

/// <summary>
/// Directional relation between two machines.
///
/// Example:  RW-001  --[Feeds]-->  CR-001
///           CR-001  --[Feeds]-->  CV-001
///           CV-001  --[Feeds]-->  RE-001
///
/// The frontend reads these from the API — no hardcoded topology anywhere.
/// </summary>
public sealed class MachineRelation : BaseEntity
{
    public Guid                SourceMachineId { get; private set; }
    public Guid                TargetMachineId { get; private set; }
    public MachineRelationType RelationType    { get; private set; }
    public string?             Description     { get; private set; }

    public Machine SourceMachine { get; private set; } = null!;
    public Machine TargetMachine { get; private set; } = null!;

    // ── EF Core ──────────────────────────────────────────────────────────
    private MachineRelation() { }

    public MachineRelation(
        Guid               sourceMachineId,
        Guid               targetMachineId,
        MachineRelationType relationType,
        string?            description = null)
    {
        DomainGuard.NotEmpty(sourceMachineId, nameof(sourceMachineId));
        DomainGuard.NotEmpty(targetMachineId, nameof(targetMachineId));

        if (sourceMachineId == targetMachineId)
            throw new DomainException("A machine cannot have a relation with itself.");

        SourceMachineId = sourceMachineId;
        TargetMachineId = targetMachineId;
        RelationType    = relationType;
        Description     = description;
    }
}
