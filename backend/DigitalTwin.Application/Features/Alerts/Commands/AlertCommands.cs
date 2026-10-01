using DigitalTwin.Application.DTOs;
using MediatR;

namespace DigitalTwin.Application.Features.Alerts.Commands;

public record AcknowledgeAlertCommand(Guid AlertId, string AcknowledgedBy) : IRequest<AlertDto>;
public record ResolveAlertCommand(Guid AlertId) : IRequest<AlertDto>;
