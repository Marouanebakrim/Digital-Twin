using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using DigitalTwin.Application.Services;
using DigitalTwin.Domain.Entities;
using DigitalTwin.Domain.Enums;
using DigitalTwin.Domain.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace DigitalTwin.Domain.Tests.Services;

public class ImpactAnalysisServiceTests
{
    private class FakeMachineRepository : IMachineRepository
    {
        public List<Machine> Machines { get; } = new();

        public Task<Machine?> GetByIdAsync(Guid id, CancellationToken ct = default)
            => Task.FromResult(Machines.FirstOrDefault(m => m.Id == id));

        public Task<Machine?> GetByIdWithSensorsAsync(Guid id, CancellationToken ct = default)
            => Task.FromResult(Machines.FirstOrDefault(m => m.Id == id));

        public Task<Machine?> GetByCodeAsync(string code, CancellationToken ct = default)
            => Task.FromResult(Machines.FirstOrDefault(m => m.Code.Equals(code, StringComparison.OrdinalIgnoreCase)));

        public Task<IReadOnlyList<Machine>> GetAllAsync(CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<Machine>>(Machines.AsReadOnly());

        public Task<IReadOnlyList<Machine>> GetAllWithSensorsAsync(CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<Machine>>(Machines.AsReadOnly());

        public Task<Machine> AddAsync(Machine machine, CancellationToken ct = default)
        {
            Machines.Add(machine);
            return Task.FromResult(machine);
        }

        public void Update(Machine machine) { }
        public void Delete(Machine machine) => Machines.Remove(machine);
        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    private class FakeMachineRelationRepository : IMachineRelationRepository
    {
        public List<MachineRelation> Relations { get; } = new();

        public Task<IReadOnlyList<MachineRelation>> GetByMachineIdAsync(Guid machineId, CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<MachineRelation>>(
                Relations.Where(r => r.SourceMachineId == machineId || r.TargetMachineId == machineId).ToList().AsReadOnly());

        public Task<IReadOnlyList<MachineRelation>> GetAllAsync(CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<MachineRelation>>(Relations.AsReadOnly());

        public Task<MachineRelation> AddAsync(MachineRelation relation, CancellationToken ct = default)
        {
            Relations.Add(relation);
            return Task.FromResult(relation);
        }

        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    private readonly FakeMachineRepository _machineRepo = new();
    private readonly FakeMachineRelationRepository _relationRepo = new();
    private readonly ImpactAnalysisService _service;

    public ImpactAnalysisServiceTests()
    {
        _service = new ImpactAnalysisService(_machineRepo, _relationRepo, NullLogger<ImpactAnalysisService>.Instance);
    }

    private Machine CreateMachine(string code, string name, MachineType type = MachineType.Crusher)
    {
        var lineId = Guid.NewGuid();
        var machine = new Machine(lineId, code, name, type);
        _machineRepo.Machines.Add(machine);
        return machine;
    }

    private MachineRelation CreateRelation(Machine source, Machine target, MachineRelationType type = MachineRelationType.Feeds, string? desc = null)
    {
        var relation = new MachineRelation(source.Id, target.Id, type, desc);
        _relationRepo.Relations.Add(relation);
        return relation;
    }

    [Fact]
    public async Task AnalyzeImpactAsync_SingleLevelOutgoingRelation_ReturnsDirectDownstreamMachine()
    {
        // Arrange: CR-001 FEEDS CV-001
        var cr001 = CreateMachine("CR-001", "Primary Crusher");
        var cv001 = CreateMachine("CV-001", "Belt Conveyor", MachineType.Conveyor);
        cr001.ChangeStatus(MachineStatus.Critical, "Vibration overload");

        CreateRelation(cr001, cv001, MachineRelationType.Feeds, "CR-001 feeds CV-001");

        // Act
        var result = await _service.AnalyzeImpactAsync(cr001.Id);

        // Assert
        result.Should().NotBeNull();
        result.RootMachineCode.Should().Be("CR-001");
        result.RootMachineStatus.Should().Be("Critical");
        result.TotalImpactedMachines.Should().Be(1);

        var impacted = result.ImpactedMachines.Single();
        impacted.MachineCode.Should().Be("CV-001");
        impacted.DepthLevel.Should().Be(1);
        impacted.DirectSourceMachineCode.Should().Be("CR-001");
        impacted.RelationType.Should().Be("Feeds");
        impacted.ImpactSeverity.Should().Be("CriticalImpact");
        impacted.ImpactPath.Should().Equal("CR-001", "CV-001");
        impacted.PotentialImpactMessage.Should().Contain("material starvation");
    }

    [Fact]
    public async Task AnalyzeImpactAsync_MultiLevelGraphTraversal_ReturnsAllCascadingDownstreamMachines()
    {
        // Arrange: CR-001 FEEDS CV-001 FEEDS RE-001
        var cr001 = CreateMachine("CR-001", "Primary Crusher");
        var cv001 = CreateMachine("CV-001", "Conveyor", MachineType.Conveyor);
        var re001 = CreateMachine("RE-001", "Reactor", MachineType.Reactor);
        cr001.ChangeStatus(MachineStatus.Critical, "Motor failure");

        CreateRelation(cr001, cv001, MachineRelationType.Feeds);
        CreateRelation(cv001, re001, MachineRelationType.Feeds);

        // Act
        var result = await _service.AnalyzeImpactAsync(cr001.Id);

        // Assert
        result.TotalImpactedMachines.Should().Be(2);

        var level1 = result.ImpactedMachines.FirstOrDefault(m => m.MachineCode == "CV-001");
        level1.Should().NotBeNull();
        level1!.DepthLevel.Should().Be(1);
        level1.DirectSourceMachineCode.Should().Be("CR-001");
        level1.ImpactPath.Should().Equal("CR-001", "CV-001");

        var level2 = result.ImpactedMachines.FirstOrDefault(m => m.MachineCode == "RE-001");
        level2.Should().NotBeNull();
        level2!.DepthLevel.Should().Be(2);
        level2.DirectSourceMachineCode.Should().Be("CV-001");
        level2.ImpactSeverity.Should().Be("HighImpact");
        level2.ImpactPath.Should().Equal("CR-001", "CV-001", "RE-001");

        result.ImpactChains.Should().Contain(c => c.Chain == "CR-001 ➔ CV-001" && c.Depth == 1);
        result.ImpactChains.Should().Contain(c => c.Chain == "CR-001 ➔ CV-001 ➔ RE-001" && c.Depth == 2);
    }

    [Fact]
    public async Task AnalyzeImpactAsync_DynamicNewMachines_WorksWithoutCodeChanges()
    {
        // Arrange dynamic unseen machines: PUMP-001 -> MILL-002 -> CV-002
        var pump = CreateMachine("PUMP-001", "Slurry Pump");
        var mill = CreateMachine("MILL-002", "Ball Mill");
        var cv = CreateMachine("CV-002", "Transfer Belt", MachineType.Conveyor);

        CreateRelation(pump, mill, MachineRelationType.Feeds);
        CreateRelation(mill, cv, MachineRelationType.DependsOn);

        // Act
        var result = await _service.AnalyzeImpactByCodeAsync("PUMP-001");

        // Assert
        result.RootMachineCode.Should().Be("PUMP-001");
        result.TotalImpactedMachines.Should().Be(2);
        result.ImpactedMachines[0].MachineCode.Should().Be("MILL-002");
        result.ImpactedMachines[0].DepthLevel.Should().Be(1);
        result.ImpactedMachines[1].MachineCode.Should().Be("CV-002");
        result.ImpactedMachines[1].DepthLevel.Should().Be(2);
        result.ImpactedMachines[1].RelationType.Should().Be("DependsOn");
    }

    [Fact]
    public async Task AnalyzeImpactAsync_DiamondDAGTopology_TraversesWithoutDuplicateNodes()
    {
        // Arrange:
        //      M1
        //     /  \
        //    M2   M3
        //     \  /
        //      M4
        var m1 = CreateMachine("M1", "Source Machine");
        var m2 = CreateMachine("M2", "Branch A");
        var m3 = CreateMachine("M3", "Branch B");
        var m4 = CreateMachine("M4", "Converged Target");

        CreateRelation(m1, m2);
        CreateRelation(m1, m3);
        CreateRelation(m2, m4);
        CreateRelation(m3, m4);

        // Act
        var result = await _service.AnalyzeImpactAsync(m1.Id);

        // Assert
        result.TotalImpactedMachines.Should().Be(3);
        result.ImpactedMachines.Select(m => m.MachineCode).Should().BeEquivalentTo(new[] { "M2", "M3", "M4" });
        result.ImpactedMachines.Count(m => m.MachineCode == "M4").Should().Be(1);
    }

    [Fact]
    public async Task AnalyzeImpactAsync_CyclicTopology_PreventsInfiniteLoop()
    {
        // Arrange cycle: M1 -> M2 -> M3 -> M1
        var m1 = CreateMachine("M1", "Machine 1");
        var m2 = CreateMachine("M2", "Machine 2");
        var m3 = CreateMachine("M3", "Machine 3");

        CreateRelation(m1, m2);
        CreateRelation(m2, m3);
        CreateRelation(m3, m1); // cycle back to M1

        // Act
        var result = await _service.AnalyzeImpactAsync(m1.Id);

        // Assert: should terminate cleanly with M2 and M3, without re-adding M1
        result.TotalImpactedMachines.Should().Be(2);
        result.ImpactedMachines.Select(m => m.MachineCode).Should().Equal("M2", "M3");
    }

    [Fact]
    public async Task AnalyzeImpactAsync_TerminalMachineWithNoOutgoingRelations_ReturnsZeroImpacted()
    {
        // Arrange
        var terminal = CreateMachine("RE-001", "End of Line Reactor", MachineType.Reactor);

        // Act
        var result = await _service.AnalyzeImpactAsync(terminal.Id);

        // Assert
        result.TotalImpactedMachines.Should().Be(0);
        result.ImpactedMachines.Should().BeEmpty();
        result.ImpactChains.Should().BeEmpty();
        result.SummaryMessage.Should().Contain("No downstream machines impacted");
    }

    [Fact]
    public async Task AnalyzeImpactAsync_MachineNotFound_ThrowsKeyNotFoundException()
    {
        // Act & Assert
        var actGuid = async () => await _service.AnalyzeImpactAsync(Guid.NewGuid());
        await actGuid.Should().ThrowAsync<KeyNotFoundException>();

        var actCode = async () => await _service.AnalyzeImpactByCodeAsync("NON-EXISTENT");
        await actCode.Should().ThrowAsync<KeyNotFoundException>();
    }
}
