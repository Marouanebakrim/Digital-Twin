using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Features.Plants;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DigitalTwin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlantsController : ControllerBase
{
    private readonly IMediator _mediator;

    public PlantsController(IMediator mediator) => _mediator = mediator;

    /// <summary>GET /api/plants - Get all plants</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PlantDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PlantDto>>> GetPlants(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetPlantsQuery(), ct);
        return Ok(result);
    }

    /// <summary>GET /api/plants/{id} - Get plant detail by ID</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PlantDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PlantDto>> GetPlantById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetPlantByIdQuery(id), ct);
        return Ok(result);
    }
}
