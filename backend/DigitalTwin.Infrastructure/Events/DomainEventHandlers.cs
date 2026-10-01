using System;
using System.Threading;
using System.Threading.Tasks;
using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Interfaces;
using DigitalTwin.Domain.Enums;
using DigitalTwin.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace DigitalTwin.Infrastructure.Events;

public class DomainEventHandlers :
    INotificationHandler<SensorReadingReceivedEvent>,
    INotificationHandler<MachineStatusChangedEvent>,
    INotificationHandler<AlertCreatedEvent>
{
    private readonly ISignalRNotificationService _signalR;
    private readonly IImpactAnalysisService _impactService;
    private readonly ILogger<DomainEventHandlers> _logger;

    public DomainEventHandlers(
        ISignalRNotificationService signalR,
        IImpactAnalysisService impactService,
        ILogger<DomainEventHandlers> logger)
    {
        _signalR = signalR;
        _impactService = impactService;
        _logger = logger;
    }

    public async Task Handle(SensorReadingReceivedEvent notification, CancellationToken cancellationToken)
    {
        var payload = new SensorReadingUpdatePayload(
            notification.MachineId,
            notification.MachineCode,
            notification.SensorId,
            notification.SensorType,
            notification.Value,
            notification.Unit,
            notification.Timestamp,
            "Running", // default, updated in engine
            null);

        await _signalR.SendSensorReadingUpdatedAsync(payload, cancellationToken);
    }

    public async Task Handle(MachineStatusChangedEvent notification, CancellationToken cancellationToken)
    {
        await _signalR.SendMachineStatusChangedAsync(
            notification.MachineId,
            notification.MachineCode,
            notification.PreviousStatus.ToString(),
            notification.NewStatus.ToString(),
            notification.Reason,
            cancellationToken);

        // When machine enters Critical status, trigger downstream Impact Analysis
        if (notification.NewStatus == MachineStatus.Critical)
        {
            try
            {
                var impactResult = await _impactService.AnalyzeImpactAsync(notification.MachineId, cancellationToken);
                await _signalR.SendPotentialImpactDetectedAsync(impactResult, cancellationToken);
                _logger.LogInformation("Impact Analysis computed & dispatched for critical machine {MachineCode}. Impacted count: {Count}",
                    notification.MachineCode, impactResult.TotalImpactedMachines);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to compute or dispatch Impact Analysis for machine {MachineCode}.", notification.MachineCode);
            }
        }
    }

    public async Task Handle(AlertCreatedEvent notification, CancellationToken cancellationToken)
    {
        var dto = new AlertDto(
            notification.AlertId,
            notification.MachineId,
            notification.MachineCode,
            notification.MachineCode,
            notification.SensorId,
            null,
            notification.Severity.ToString(),
            notification.Type.ToString(),
            notification.Title,
            notification.Message,
            false,
            null,
            null,
            notification.CreatedAt,
            null);

        await _signalR.SendAlertCreatedAsync(dto, cancellationToken);
    }
}
