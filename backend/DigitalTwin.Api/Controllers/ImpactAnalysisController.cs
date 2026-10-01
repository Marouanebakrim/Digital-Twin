using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace DigitalTwin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImpactAnalysisController : ControllerBase
{
    private readonly IImpactAnalysisService _impactService;

    public ImpactAnalysisController(IImpactAnalysisService impactService)
    {
        _impactService = impactService;
    }

    /// <summary>
    /// GET /api/impact-analysis/{machineId}
    /// Evaluates downstream cascading impact for the specified machine ID across all relation levels.
    /// </summary>
    [HttpGet("{machineId:guid}")]
    [ProducesResponseType(typeof(ImpactAnalysisResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ImpactAnalysisResultDto>> GetImpactByMachineId(Guid machineId, CancellationToken ct)
    {
        try
        {
            var result = await _impactService.AnalyzeImpactAsync(machineId, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/impact-analysis/by-code/{machineCode}
    /// Evaluates downstream cascading impact for the specified machine code (e.g. "CR-001").
    /// </summary>
    [HttpGet("by-code/{machineCode}")]
    [ProducesResponseType(typeof(ImpactAnalysisResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ImpactAnalysisResultDto>> GetImpactByMachineCode(string machineCode, CancellationToken ct)
    {
        try
        {
            var result = await _impactService.AnalyzeImpactByCodeAsync(machineCode, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
