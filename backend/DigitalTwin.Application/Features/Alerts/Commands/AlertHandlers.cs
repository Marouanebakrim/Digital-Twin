using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Mappers;
using DigitalTwin.Domain.Interfaces;
using MediatR;

namespace DigitalTwin.Application.Features.Alerts.Commands;

public class AcknowledgeAlertHandler : IRequestHandler<AcknowledgeAlertCommand, AlertDto>
{
    private readonly IAlertRepository _alertRepository;

    public AcknowledgeAlertHandler(IAlertRepository alertRepository)
        => _alertRepository = alertRepository;

    public async Task<AlertDto> Handle(AcknowledgeAlertCommand request, CancellationToken cancellationToken)
    {
        var alert = await _alertRepository.GetByIdAsync(request.AlertId, cancellationToken)
            ?? throw new KeyNotFoundException($"Alert {request.AlertId} not found.");

        alert.Acknowledge(request.AcknowledgedBy);
        _alertRepository.Update(alert);
        await _alertRepository.SaveChangesAsync(cancellationToken);

        return AlertMapper.ToDto(alert);
    }
}

public class ResolveAlertHandler : IRequestHandler<ResolveAlertCommand, AlertDto>
{
    private readonly IAlertRepository _alertRepository;

    public ResolveAlertHandler(IAlertRepository alertRepository)
        => _alertRepository = alertRepository;

    public async Task<AlertDto> Handle(ResolveAlertCommand request, CancellationToken cancellationToken)
    {
        var alert = await _alertRepository.GetByIdAsync(request.AlertId, cancellationToken)
            ?? throw new KeyNotFoundException($"Alert {request.AlertId} not found.");

        alert.Resolve();
        _alertRepository.Update(alert);
        await _alertRepository.SaveChangesAsync(cancellationToken);

        return AlertMapper.ToDto(alert);
    }
}
