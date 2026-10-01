using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Interfaces;
using DigitalTwin.Domain.Entities;
using DigitalTwin.Domain.Enums;
using DigitalTwin.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace DigitalTwin.Application.Services;

/// <summary>
/// Service implementing dynamic multi-level graph traversal for machine impact analysis.
/// Discovers outgoing relationships dynamically via IMachineRelationRepository without hardcoded topology.
/// Includes cycle prevention and multi-depth dependency resolution.
/// </summary>
public sealed class ImpactAnalysisService : IImpactAnalysisService
{
    private readonly IMachineRepository _machineRepo;
    private readonly IMachineRelationRepository _relationRepo;
    private readonly ILogger<ImpactAnalysisService> _logger;

    public ImpactAnalysisService(
        IMachineRepository machineRepo,
        IMachineRelationRepository relationRepo,
        ILogger<ImpactAnalysisService> logger)
    {
        _machineRepo = machineRepo;
        _relationRepo = relationRepo;
        _logger = logger;
    }

    public async Task<ImpactAnalysisResultDto> AnalyzeImpactAsync(Guid machineId, CancellationToken cancellationToken = default)
    {
        var rootMachine = await _machineRepo.GetByIdAsync(machineId, cancellationToken)
            ?? throw new KeyNotFoundException($"Machine with ID '{machineId}' was not found.");

        return await TraverseGraphAsync(rootMachine, cancellationToken);
    }

    public async Task<ImpactAnalysisResultDto> AnalyzeImpactByCodeAsync(string machineCode, CancellationToken cancellationToken = default)
    {
        var rootMachine = await _machineRepo.GetByCodeAsync(machineCode, cancellationToken)
            ?? throw new KeyNotFoundException($"Machine with code '{machineCode}' was not found.");

        return await TraverseGraphAsync(rootMachine, cancellationToken);
    }

    private async Task<ImpactAnalysisResultDto> TraverseGraphAsync(Machine rootMachine, CancellationToken ct)
    {
        _logger.LogInformation("Starting Impact Analysis for root machine {MachineCode} (Status: {Status})...", rootMachine.Code, rootMachine.Status);

        // 1. Fetch all relations and machines dynamically from repository (no hardcoding)
        var allRelations = await _relationRepo.GetAllAsync(ct);
        var allMachinesList = await _machineRepo.GetAllAsync(ct);
        var machineLookup = allMachinesList.ToDictionary(m => m.Id);

        // 2. Build outgoing adjacency mapping: SourceMachineId -> List<MachineRelation>
        var outgoingMap = allRelations
            .GroupBy(r => r.SourceMachineId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var impactedMachines = new List<ImpactedMachineDto>();
        var impactChains = new List<ImpactChainDto>();

        // 3. Multi-level Breadth-First Search (BFS) with cycle prevention
        var queue = new Queue<(Guid MachineId, string MachineCode, int Depth, List<string> Path)>();
        var visited = new HashSet<Guid> { rootMachine.Id };

        queue.Enqueue((rootMachine.Id, rootMachine.Code, 0, new List<string> { rootMachine.Code }));

        while (queue.Count > 0)
        {
            var (currentId, currentCode, currentDepth, currentPath) = queue.Dequeue();

            if (!outgoingMap.TryGetValue(currentId, out var outgoingList))
            {
                continue;
            }

            foreach (var relation in outgoingList)
            {
                var targetId = relation.TargetMachineId;

                // Resolve target machine entity metadata
                var targetMachine = relation.TargetMachine ??
                    (machineLookup.TryGetValue(targetId, out var tm) ? tm : null);

                if (targetMachine is null)
                {
                    _logger.LogWarning("Target machine {TargetId} for relation {RelationId} was not found.", targetId, relation.Id);
                    continue;
                }

                // Cycle prevention: only visit unvisited nodes
                if (visited.Add(targetId))
                {
                    var nextDepth = currentDepth + 1;
                    var nextPath = new List<string>(currentPath) { targetMachine.Code };

                    var severity = nextDepth switch
                    {
                        1 => "CriticalImpact",
                        2 => "HighImpact",
                        _ => "MediumImpact"
                    };

                    var potentialImpactMessage = relation.RelationType switch
                    {
                        MachineRelationType.Feeds =>
                            $"Direct feed interrupted: downstream machine '{targetMachine.Code}' will suffer material starvation from '{currentCode}'.",
                        MachineRelationType.DependsOn =>
                            $"Dependency alert: downstream machine '{targetMachine.Code}' depends on operational availability of '{currentCode}'.",
                        _ =>
                            $"Process flow disruption: downstream machine '{targetMachine.Code}' impacted by failure in '{currentCode}'."
                    };

                    var impactedDto = new ImpactedMachineDto(
                        targetMachine.Id,
                        targetMachine.Code,
                        targetMachine.Name,
                        targetMachine.Type.ToString(),
                        targetMachine.Status.ToString(),
                        nextDepth,
                        relation.RelationType.ToString(),
                        relation.Description,
                        currentCode,
                        nextPath.AsReadOnly(),
                        severity,
                        potentialImpactMessage
                    );

                    impactedMachines.Add(impactedDto);

                    var chainString = string.Join(" ➔ ", nextPath);
                    impactChains.Add(new ImpactChainDto(chainString, nextDepth));

                    _logger.LogInformation("Impact detected: Level {Depth} -> {TargetCode} (Chain: {Chain})", nextDepth, targetMachine.Code, chainString);

                    // Queue for subsequent downstream levels
                    queue.Enqueue((targetId, targetMachine.Code, nextDepth, nextPath));
                }
            }
        }

        var maxDepth = impactedMachines.Count > 0 ? impactedMachines.Max(m => m.DepthLevel) : 0;
        var summary = impactedMachines.Count > 0
            ? $"Potential impact detected: {impactedMachines.Count} downstream machine(s) affected across {maxDepth} level(s)."
            : $"No downstream machines impacted by '{rootMachine.Code}'.";

        return new ImpactAnalysisResultDto(
            rootMachine.Id,
            rootMachine.Code,
            rootMachine.Name,
            rootMachine.Status.ToString(),
            DateTime.UtcNow,
            impactedMachines.Count,
            impactedMachines.AsReadOnly(),
            impactChains.AsReadOnly(),
            summary
        );
    }
}
