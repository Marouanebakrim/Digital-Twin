using DigitalTwin.Domain.Common;
using DigitalTwin.Domain.Enums;
using DigitalTwin.Domain.Exceptions;

namespace DigitalTwin.Domain.Entities;

/// <summary>
/// An alert raised against a machine — optionally linked to the triggering sensor.
/// </summary>
public sealed class Alert : BaseEntity
{
    // ── Properties ───────────────────────────────────────────────────────
    public Guid          MachineId      { get; private set; }
    public Guid?         SensorId       { get; private set; }
    public AlertSeverity Severity       { get; private set; }
    public AlertType     Type           { get; private set; }
    public string        Title          { get; private set; } = string.Empty;
    public string?       Message        { get; private set; }
    public bool          IsAcknowledged { get; private set; }
    public DateTime?     AcknowledgedAt { get; private set; }
    public string?       AcknowledgedBy { get; private set; }
    public DateTime?     ResolvedAt     { get; private set; }

    // ── Navigation ───────────────────────────────────────────────────────
    public Machine Machine { get; private set; } = null!;
    public Sensor? Sensor  { get; private set; }

    // ── EF Core ──────────────────────────────────────────────────────────
    private Alert() { }

    // ── Constructor ──────────────────────────────────────────────────────
    public Alert(
        Guid          machineId,
        Guid?         sensorId,
        AlertSeverity severity,
        AlertType     type,
        string        title,
        string?       message = null)
    {
        DomainGuard.NotEmpty(machineId,            nameof(machineId));
        DomainGuard.NotNullOrWhiteSpace(title,     nameof(title));
        DomainGuard.MaxLength(title, 200,          nameof(title));

        MachineId = machineId;
        SensorId  = sensorId;
        Severity  = severity;
        Type      = type;
        Title     = title;
        Message   = message;
    }

    // ── Behaviour ────────────────────────────────────────────────────────

    /// <summary>
    /// Acknowledge the alert (can only be done once).
    /// </summary>
    public void Acknowledge(string acknowledgedBy)
    {
        DomainGuard.NotNullOrWhiteSpace(acknowledgedBy, nameof(acknowledgedBy));

        if (IsAcknowledged)
            throw new DomainException($"Alert {Id} is already acknowledged.");

        if (ResolvedAt.HasValue)
            throw new DomainException($"Cannot acknowledge a resolved alert ({Id}).");

        IsAcknowledged = true;
        AcknowledgedAt = DateTime.UtcNow;
        AcknowledgedBy = acknowledgedBy;
        MarkUpdated();
    }

    /// <summary>
    /// Mark the alert as resolved (independently of acknowledgement).
    /// </summary>
    public void Resolve()
    {
        if (ResolvedAt.HasValue)
            throw new DomainException($"Alert {Id} is already resolved.");

        ResolvedAt = DateTime.UtcNow;
        MarkUpdated();
    }

    public bool IsResolved => ResolvedAt.HasValue;
    public bool IsOpen     => !IsResolved;
}
