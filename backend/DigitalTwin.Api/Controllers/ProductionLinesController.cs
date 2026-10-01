using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Features.Plants;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DigitalTwin.Api.Controllers;

[ApiController]
[Route("api/production-lines")]
public class ProductionLinesController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProductionLinesController(IMediator mediator) => _mediator = mediator;

    /// <summary>GET /api/production-lines - Get all production lines</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ProductionLineDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ProductionLineDto>>> GetProductionLines(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetProductionLinesQuery(), ct);
        return Ok(result);
    }

    /// <summary>GET /api/production-lines/{id} - Get production line detail by ID</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProductionLineDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductionLineDto>> GetProductionLineById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetProductionLineByIdQuery(id), ct);
        return Ok(result);
    }
}
