using DigitalTwin.Domain.Common;
using DigitalTwin.Domain.Exceptions;

namespace DigitalTwin.Domain.Entities;

/// <summary>
/// Represents a line of production machines inside a plant.
/// Owns the ordered set of machines assigned to it.
/// </summary>
public sealed class ProductionLine : BaseEntity
{
    private readonly List<Machine> _machines = [];

    public Guid    PlantId     { get; private set; }
    public string  Name        { get; private set; } = string.Empty;
    public string? Description { get; private set; }

    // ── Navigation ────────────────────────────────────────────────────────
    public Plant Plant { get; private set; } = null!;

    public IReadOnlyList<Machine> Machines => _machines.AsReadOnly();

    // ── EF Core ──────────────────────────────────────────────────────────
    private ProductionLine() { }

    // ── Constructor ──────────────────────────────────────────────────────
    public ProductionLine(Guid plantId, string name, string? description = null)
    {
        DomainGuard.NotEmpty(plantId,            nameof(plantId));
        DomainGuard.NotNullOrWhiteSpace(name,    nameof(name));
        DomainGuard.MaxLength(name, 200,         nameof(name));

        Id          = Guid.NewGuid();
        PlantId     = plantId;
        Name        = name;
        Description = description;
    }

    public void Update(string name, string? description)
    {
        DomainGuard.NotNullOrWhiteSpace(name, nameof(name));
        DomainGuard.MaxLength(name, 200,      nameof(name));

        Name        = name;
        Description = description;
        MarkUpdated();
    }
}
