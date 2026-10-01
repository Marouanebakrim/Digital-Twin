using System;
using System.Collections.Generic;

namespace DigitalTwin.Application.DTOs;

/// <summary>
/// Detailed metadata of a downstream machine affected by a critical failure.
/// </summary>
public record ImpactedMachineDto(
    Guid MachineId,
    string MachineCode,
    string MachineName,
    string MachineType,
    string CurrentStatus,
    int DepthLevel,
    string RelationType,
    string? RelationDescription,
    string DirectSourceMachineCode,
    IReadOnlyList<string> ImpactPath,
    string ImpactSeverity,
    string PotentialImpactMessage);

/// <summary>
/// Linear dependency chain path from root failure to downstream endpoint (e.g. CR-001 -> CV-001 -> RE-001).
/// </summary>
public record ImpactChainDto(
    string Chain,
    int Depth);

/// <summary>
/// Root impact analysis response containing all affected downstream machines and cascade paths.
/// </summary>
public record ImpactAnalysisResultDto(
    Guid RootMachineId,
    string RootMachineCode,
    string RootMachineName,
    string RootMachineStatus,
    DateTime AnalyzedAt,
    int TotalImpactedMachines,
    IReadOnlyList<ImpactedMachineDto> ImpactedMachines,
    IReadOnlyList<ImpactChainDto> ImpactChains,
    string SummaryMessage);
