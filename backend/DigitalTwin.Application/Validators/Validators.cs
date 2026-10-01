using DigitalTwin.Application.DTOs;
using FluentValidation;

namespace DigitalTwin.Application.Validators;

public class SubmitReadingValidator : AbstractValidator<SubmitReadingDto>
{
    public SubmitReadingValidator()
    {
        RuleFor(x => x.Value)
            .Must(v => !double.IsNaN(v) && !double.IsInfinity(v))
            .WithMessage("Value must be a valid finite number.");

        RuleFor(x => x.Timestamp)
            .Must(t => !t.HasValue || t.Value <= DateTime.UtcNow.AddMinutes(1))
            .WithMessage("Timestamp cannot be in the future.");
    }
}
