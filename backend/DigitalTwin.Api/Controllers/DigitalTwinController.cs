using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Features.Dashboard.Queries;
using DigitalTwin.Application.Features.DigitalTwin;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DigitalTwin.Api.Controllers;

[ApiController]
[Route("api/digital-twin")]
public class DigitalTwinController : ControllerBase
{
    private readonly IMediator _mediator;

    public DigitalTwinController(IMediator mediator) => _mediator = mediator;

    /// <summary>GET /api/digital-twin - Get complete plant topology (nodes &amp; edges)</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PlantTopologyDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<PlantTopologyDto>> GetPlantTopology(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetPlantTopologyQuery(), ct);
        return Ok(result);
    }

    /// <summary>GET /api/digital-twin/summary - Get dashboard KPIs summary</summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(DashboardSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardSummaryDto>> GetDashboardSummary(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetDashboardSummaryQuery(), ct);
        return Ok(result);
    }

    /// <summary>GET /api/digital-twin/machines/{id} - Get complete live digital twin state of a machine</summary>
    [HttpGet("machines/{id:guid}")]
    [ProducesResponseType(typeof(DigitalTwinStateDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DigitalTwinStateDto>> GetMachineDigitalTwinState(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetDigitalTwinMachineStateQuery(id), ct);
        return Ok(result);
    }

    /// <summary>
    /// GET /api/digital-twin/machines/{id}/current-state
    /// Returns the engine-computed, sensor-driven current state of a machine.
    /// No fixed properties — fully dynamic based on actual sensors.
    /// </summary>
    [HttpGet("machines/{id:guid}/current-state")]
    [ProducesResponseType(typeof(CurrentMachineStateDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CurrentMachineStateDto>> GetCurrentMachineState(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetCurrentMachineStateQuery(id), ct);
        return Ok(result);
    }
}
