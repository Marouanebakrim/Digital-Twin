using DigitalTwin.Domain.Common;
using DigitalTwin.Domain.Exceptions;

namespace DigitalTwin.Domain.Entities;

/// <summary>
/// Root aggregate — represents the physical industrial plant.
/// Owns its production lines.
/// </summary>
public sealed class Plant : AggregateRoot
{
    // ── Private backing fields (EF Core maps these) ──────────────────────────
    private readonly List<ProductionLine> _productionLines = [];

    // ── Properties ───────────────────────────────────────────────────────────
    public string Name     { get; private set; } = string.Empty;
    public string Location { get; private set; } = string.Empty;
    public string? Description { get; private set; }

    /// <summary>All production lines belonging to this plant.</summary>
    public IReadOnlyList<ProductionLine> ProductionLines => _productionLines.AsReadOnly();

    // ── EF Core parameterless constructor (must stay private) ────────────────
    private Plant() { }

    // ── Factory / public constructor ─────────────────────────────────────────
    public Plant(string name, string location, string? description = null)
    {
        DomainGuard.NotNullOrWhiteSpace(name,     nameof(name));
        DomainGuard.NotNullOrWhiteSpace(location, nameof(location));
        DomainGuard.MaxLength(name, 200,     nameof(name));
        DomainGuard.MaxLength(location, 200, nameof(location));

        Id          = Guid.NewGuid();
        Name        = name;
        Location    = location;
        Description = description;
    }

    // ── Behaviour ────────────────────────────────────────────────────────────
    public void Update(string name, string location, string? description)
    {
        DomainGuard.NotNullOrWhiteSpace(name,     nameof(name));
        DomainGuard.NotNullOrWhiteSpace(location, nameof(location));
        DomainGuard.MaxLength(name, 200,     nameof(name));
        DomainGuard.MaxLength(location, 200, nameof(location));

        Name        = name;
        Location    = location;
        Description = description;
        MarkUpdated();
    }
}
