using DigitalTwin.Domain.Exceptions;

namespace DigitalTwin.Domain.Exceptions;

/// <summary>
/// Lightweight guard utilities used inside domain entities to enforce
/// preconditions without pulling in external validation libraries.
/// </summary>
public static class DomainGuard
{
    public static void NotNullOrWhiteSpace(string? value, string paramName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException($"'{paramName}' must not be null or whitespace.");
    }

    public static void NotEmpty(Guid value, string paramName)
    {
        if (value == Guid.Empty)
            throw new DomainException($"'{paramName}' must not be an empty GUID.");
    }

    public static void MaxLength(string value, int maxLength, string paramName)
    {
        if (value.Length > maxLength)
            throw new DomainException($"'{paramName}' must not exceed {maxLength} characters (got {value.Length}).");
    }

    public static void GreaterThanZero(double value, string paramName)
    {
        if (value <= 0)
            throw new DomainException($"'{paramName}' must be greater than zero.");
    }

    public static void InRange(double value, double min, double max, string paramName)
    {
        if (value < min || value > max)
            throw new DomainException($"'{paramName}' must be between {min} and {max} (got {value}).");
    }
}
