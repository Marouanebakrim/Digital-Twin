namespace DigitalTwin.Domain.Common;

/// <summary>
/// Base for all domain entities. Carries identity and audit timestamps.
/// No persistence logic lives here.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; }

    /// <summary>UTC timestamp of creation (set once).</summary>
    public DateTime CreatedAt { get; protected set; } = DateTime.UtcNow;

    /// <summary>UTC timestamp of the last mutation (null until first update).</summary>
    public DateTime? UpdatedAt { get; protected set; }

    /// <summary>Call from entity mutating methods to record the update time.</summary>
    protected void MarkUpdated() => UpdatedAt = DateTime.UtcNow;
}
