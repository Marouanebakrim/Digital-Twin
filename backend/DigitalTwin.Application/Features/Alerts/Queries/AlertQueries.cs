using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Mappers;
using DigitalTwin.Domain.Enums;
using DigitalTwin.Domain.Interfaces;
using MediatR;

namespace DigitalTwin.Application.Features.Alerts.Queries;

public record GetAlertsQuery(bool? Acknowledged = null, Guid? MachineId = null, AlertSeverity? Severity = null)
    : IRequest<IEnumerable<AlertDto>>;

public class GetAlertsHandler : IRequestHandler<GetAlertsQuery, IEnumerable<AlertDto>>
{
    private readonly IAlertRepository _alertRepository;

    public GetAlertsHandler(IAlertRepository alertRepository) => _alertRepository = alertRepository;

    public async Task<IEnumerable<AlertDto>> Handle(GetAlertsQuery request, CancellationToken ct)
    {
        var alerts = await _alertRepository.GetAllAsync(request.Acknowledged, request.MachineId, request.Severity, ct);
        return alerts.Select(AlertMapper.ToDto);
    }
}
