using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Features.Sensors;
using DigitalTwin.Application.Features.Sensors.Commands;
using DigitalTwin.Application.Features.Sensors.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DigitalTwin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SensorsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SensorsController(IMediator mediator) => _mediator = mediator;

    /// <summary>GET /api/sensors/{id} - Get sensor detail by ID</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(SensorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SensorDto>> GetSensorById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetSensorByIdQuery(id), ct);
        return Ok(result);
    }

    /// <summary>POST /api/sensors/{sensorId}/readings - Ingest a new sensor measurement</summary>
    [HttpPost("{sensorId:guid}/readings")]
    [ProducesResponseType(typeof(SensorReadingDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SensorReadingDto>> PostReading(
        Guid sensorId,
        [FromBody] SubmitReadingDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new SubmitSensorReadingCommand(sensorId, dto.Value, dto.Timestamp), ct);
        return CreatedAtAction(nameof(GetLatestReading), new { sensorId }, result);
    }

    /// <summary>GET /api/sensors/{sensorId}/readings - Get historical readings for a sensor</summary>
    [HttpGet("{sensorId:guid}/readings")]
    [ProducesResponseType(typeof(IEnumerable<SensorReadingDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<SensorReadingDto>>> GetReadings(
        Guid sensorId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int pageSize = 500,
        CancellationToken ct = default)
    {
        var fromTime = from ?? DateTime.UtcNow.AddHours(-24);
        var toTime = to ?? DateTime.UtcNow;

        var result = await _mediator.Send(new GetSensorReadingsQuery(sensorId, fromTime, toTime, pageSize), ct);
        return Ok(result);
    }

    /// <summary>GET /api/sensors/{sensorId}/readings/latest - Get latest reading of a sensor</summary>
    [HttpGet("{sensorId:guid}/readings/latest")]
    [ProducesResponseType(typeof(SensorReadingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SensorReadingDto>> GetLatestReading(Guid sensorId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetLatestSensorReadingQuery(sensorId), ct);
        if (result == null) return NotFound($"No readings found for sensor {sensorId}");
        return Ok(result);
    }
}
