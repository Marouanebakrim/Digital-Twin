using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Features.Relations;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DigitalTwin.Api.Controllers;

[ApiController]
[Route("api/machine-relations")]
public class MachineRelationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public MachineRelationsController(IMediator mediator) => _mediator = mediator;

    /// <summary>POST /api/machine-relations - Create a directional relation between two machines</summary>
    [HttpPost]
    [ProducesResponseType(typeof(MachineRelationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MachineRelationDto>> CreateRelation(
        [FromBody] CreateMachineRelationDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new CreateMachineRelationCommand(dto), ct);
        return CreatedAtAction("GetMachineRelations", "Machines", new { machineId = result.SourceMachineId }, result);
    }
}
