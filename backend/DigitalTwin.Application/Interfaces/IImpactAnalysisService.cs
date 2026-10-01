using DigitalTwin.Application.DTOs;

namespace DigitalTwin.Application.Interfaces;

/// <summary>
/// Service for analyzing downstream cascading impact when a machine enters an abnormal or critical state.
/// Dynamically traverses the directional graph of MachineRelations (multi-level traversal with cycle detection).
/// </summary>
public interface IImpactAnalysisService
{
    /// <summary>
    /// Analyzes the downstream cascading impact for a given machine ID.
    /// </summary>
    Task<ImpactAnalysisResultDto> AnalyzeImpactAsync(Guid machineId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Analyzes the downstream cascading impact for a given machine business code (e.g. "CR-001").
    /// </summary>
    Task<ImpactAnalysisResultDto> AnalyzeImpactByCodeAsync(string machineCode, CancellationToken cancellationToken = default);
}
