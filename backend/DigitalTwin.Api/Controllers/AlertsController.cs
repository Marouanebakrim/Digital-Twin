using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Features.Alerts.Commands;
using DigitalTwin.Application.Features.Alerts.Queries;
using DigitalTwin.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DigitalTwin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AlertsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AlertsController(IMediator mediator) => _mediator = mediator;

    /// <summary>GET /api/alerts - Get all alerts with optional filters</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AlertDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AlertDto>>> GetAlerts(
        [FromQuery] bool? acknowledged,
        [FromQuery] Guid? machineId,
        [FromQuery] AlertSeverity? severity,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new GetAlertsQuery(acknowledged, machineId, severity), ct);
        return Ok(result);
    }

    /// <summary>PUT /api/alerts/{id}/acknowledge - Acknowledge an alert</summary>
    [HttpPut("{id:guid}/acknowledge")]
    [HttpPost("{id:guid}/acknowledge")]
    [ProducesResponseType(typeof(AlertDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AlertDto>> AcknowledgeAlert(
        Guid id,
        [FromBody] AcknowledgeAlertDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new AcknowledgeAlertCommand(id, dto.AcknowledgedBy), ct);
        return Ok(result);
    }

    /// <summary>PUT /api/alerts/{id}/resolve - Resolve an alert</summary>
    [HttpPut("{id:guid}/resolve")]
    [HttpPost("{id:guid}/resolve")]
    [ProducesResponseType(typeof(AlertDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AlertDto>> ResolveAlert(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new ResolveAlertCommand(id), ct);
        return Ok(result);
    }
}
