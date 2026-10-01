namespace DigitalTwin.Domain.Exceptions;

/// <summary>
/// Represents a violation of a domain business rule.
/// Thrown by entities and value objects — never by infrastructure code.
/// </summary>
public sealed class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
    public DomainException(string message, Exception innerException) : base(message, innerException) { }
}
