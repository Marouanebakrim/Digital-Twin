using MediatR;

namespace DigitalTwin.Domain.Common;

/// <summary>
/// Base for aggregate roots. Collects domain events raised during a
/// business operation; they are dispatched by the Infrastructure layer
/// after persistence succeeds.
/// </summary>
public abstract class AggregateRoot : BaseEntity
{
    private readonly List<INotification> _domainEvents = [];

    /// <summary>Read-only view of pending domain events.</summary>
    public IReadOnlyList<INotification> DomainEvents => _domainEvents.AsReadOnly();

    /// <summary>Enqueue a domain event to be dispatched after the unit of work commits.</summary>
    protected void RaiseDomainEvent(INotification domainEvent)
        => _domainEvents.Add(domainEvent);

    /// <summary>Called by Infrastructure after events have been dispatched.</summary>
    public void ClearDomainEvents() => _domainEvents.Clear();
}
