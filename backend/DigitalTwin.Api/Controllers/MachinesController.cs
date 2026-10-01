using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Features.Alerts.Queries;
using DigitalTwin.Application.Features.Machines.Commands;
using DigitalTwin.Application.Features.Machines.Queries;
using DigitalTwin.Application.Features.Relations;
using DigitalTwin.Application.Features.Sensors;
using DigitalTwin.Application.Features.Sensors.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DigitalTwin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MachinesController : ControllerBase
{
    private readonly IMediator _mediator;

    public MachinesController(IMediator mediator) => _mediator = mediator;

    /// <summary>GET /api/machines - List all machines</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<MachineSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<MachineSummaryDto>>> GetMachines(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetMachinesQuery(), ct);
        return Ok(result);
    }

    /// <summary>GET /api/machines/{id} - Get machine detail with sensors & relations</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(MachineDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MachineDetailDto>> GetMachineById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetMachineByIdQuery(id), ct);
        return Ok(result);
    }

    /// <summary>POST /api/machines - Create a new machine</summary>
    [HttpPost]
    [ProducesResponseType(typeof(MachineDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MachineDetailDto>> CreateMachine([FromBody] CreateMachineDto dto, CancellationToken ct)
    {
        var result = await _mediator.Send(new CreateMachineCommand(dto), ct);
        return CreatedAtAction(nameof(GetMachineById), new { id = result.Id }, result);
    }

    /// <summary>PUT /api/machines/{id} - Update machine properties</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(MachineDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MachineDetailDto>> UpdateMachine(Guid id, [FromBody] UpdateMachineDto dto, CancellationToken ct)
    {
        var result = await _mediator.Send(new UpdateMachineCommand(id, dto), ct);
        return Ok(result);
    }

    /// <summary>DELETE /api/machines/{id} - Delete a machine</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteMachine(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteMachineCommand(id), ct);
        return NoContent();
    }

    // â”€â”€ Machine sub-resources â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /// <summary>GET /api/machines/{machineId}/sensors - List sensors of a machine</summary>
    [HttpGet("{machineId:guid}/sensors")]
    [ProducesResponseType(typeof(IEnumerable<SensorDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<SensorDto>>> GetMachineSensors(Guid machineId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetSensorsByMachineIdQuery(machineId), ct);
        return Ok(result);
    }

    /// <summary>POST /api/machines/{machineId}/sensors - Add a sensor to a machine</summary>
    [HttpPost("{machineId:guid}/sensors")]
    [ProducesResponseType(typeof(SensorDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SensorDto>> CreateSensor(Guid machineId, [FromBody] CreateSensorDto dto, CancellationToken ct)
    {
        var result = await _mediator.Send(new CreateSensorCommand(machineId, dto), ct);
        return CreatedAtAction("GetSensorById", "Sensors", new { id = result.Id }, result);
    }

    /// <summary>GET /api/machines/{machineId}/readings - Get historical readings across all sensors of a machine</summary>
    [HttpGet("{machineId:guid}/readings")]
    [ProducesResponseType(typeof(IEnumerable<SensorReadingDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<SensorReadingDto>>> GetMachineReadings(
        Guid machineId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int pageSize = 500,
        CancellationToken ct = default)
    {
        var fromTime = from ?? DateTime.UtcNow.AddHours(-24);
        var toTime = to ?? DateTime.UtcNow;

        var result = await _mediator.Send(new GetMachineReadingsQuery(machineId, fromTime, toTime, pageSize), ct);
        return Ok(result);
    }

    /// <summary>GET /api/machines/{machineId}/alerts - Get alerts for a machine</summary>
    [HttpGet("{machineId:guid}/alerts")]
    [ProducesResponseType(typeof(IEnumerable<AlertDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AlertDto>>> GetMachineAlerts(
        Guid machineId,
        [FromQuery] bool? acknowledged,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new GetAlertsQuery(acknowledged, machineId), ct);
        return Ok(result);
    }

    /// <summary>POST /api/machines/reset-scenario - Reset all machines to Running and resolve all open alerts. Used by the Reset Normal button.</summary>
    [HttpPost("reset-scenario")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> ResetScenario(CancellationToken ct)
    {
        var result = await _mediator.Send(new ResetScenarioCommand(), ct);
        return Ok(new
        {
            message = $"Scenario reset: {result.MachinesReset} machine(s) restored to Running, {result.AlertsResolved} alert(s) resolved.",
            machinesReset  = result.MachinesReset,
            alertsResolved = result.AlertsResolved
        });
    }

    /// <summary>GET /api/machines/{machineId}/relations - Get relations (upstream & downstream) of a machine</summary>
    [HttpGet("{machineId:guid}/relations")]
    [ProducesResponseType(typeof(IEnumerable<MachineRelationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<MachineRelationDto>>> GetMachineRelations(Guid machineId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetMachineRelationsQuery(machineId), ct);
        return Ok(result);
    }
}
