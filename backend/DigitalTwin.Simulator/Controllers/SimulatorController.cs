using Microsoft.AspNetCore.Mvc;

namespace DigitalTwin.Simulator.Controllers;

/// <summary>
/// REST API for controlling the simulator at runtime.
/// Available at http://localhost:5001/api/simulator
/// </summary>
[ApiController]
[Route("api/simulator")]
public class SimulatorController : ControllerBase
{
    private readonly SimulatorWorker _worker;

    public SimulatorController(SimulatorWorker worker) => _worker = worker;

    /// <summary>GET /api/simulator/status - Returns current simulator status</summary>
    [HttpGet("status")]
    public IActionResult GetStatus()
        => Ok(new
        {
            isRunning  = _worker.IsRunning,
            mode       = _worker.Mode,
            intervalMs = _worker.IntervalMs,
            startedAt  = _worker.StartedAt
        });

    /// <summary>
    /// POST /api/simulator/mode
    /// Changes the simulation mode.
    /// Allowed: normal | warning | critical | scenario
    /// </summary>
    [HttpPost("mode")]
    public IActionResult ChangeMode([FromBody] ChangeModeRequest? request)
    {
        if (string.IsNullOrWhiteSpace(request?.Mode))
            return BadRequest("Mode parameter is required.");

        var mode = request.Mode.Trim().ToLowerInvariant();
        var allowed = new[] { "normal", "warning", "critical", "scenario" };
        if (!allowed.Contains(mode))
            return BadRequest($"Invalid mode '{request.Mode}'. Allowed values: {string.Join(", ", allowed)}");

        _worker.SetMode(mode);
        return Ok(new { message = $"Mode changed to '{mode}'.", mode = _worker.Mode });
    }
}

public record ChangeModeRequest(string? Mode);
