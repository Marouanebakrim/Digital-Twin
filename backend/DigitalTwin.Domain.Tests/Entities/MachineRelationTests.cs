using DigitalTwin.Domain.Entities;
using DigitalTwin.Domain.Enums;
using DigitalTwin.Domain.Exceptions;
using FluentAssertions;

namespace DigitalTwin.Domain.Tests.Entities;

public class MachineRelationTests
{
    private static Guid MachineId1 => Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static Guid MachineId2 => Guid.Parse("22222222-2222-2222-2222-222222222222");

    [Fact]
    public void Constructor_WithValidParameters_CreatesRelation()
    {
        var rel = new MachineRelation(MachineId1, MachineId2, MachineRelationType.Feeds, "RW-001 feeds CR-001");

        rel.SourceMachineId.Should().Be(MachineId1);
        rel.TargetMachineId.Should().Be(MachineId2);
        rel.RelationType.Should().Be(MachineRelationType.Feeds);
        rel.Description.Should().Be("RW-001 feeds CR-001");
    }

    [Fact]
    public void Constructor_WithSameSourceAndTarget_ThrowsDomainException()
    {
        var act = () => new MachineRelation(MachineId1, MachineId1, MachineRelationType.Feeds);
        act.Should().Throw<DomainException>().WithMessage("*cannot have a relation with itself*");
    }

    [Fact]
    public void Constructor_WithEmptySourceId_ThrowsDomainException()
    {
        var act = () => new MachineRelation(Guid.Empty, MachineId2, MachineRelationType.Feeds);
        act.Should().Throw<DomainException>().WithMessage("*sourceMachineId*");
    }

    [Fact]
    public void Constructor_WithEmptyTargetId_ThrowsDomainException()
    {
        var act = () => new MachineRelation(MachineId1, Guid.Empty, MachineRelationType.Feeds);
        act.Should().Throw<DomainException>().WithMessage("*targetMachineId*");
    }

    [Theory]
    [InlineData(MachineRelationType.Feeds)]
    [InlineData(MachineRelationType.DependsOn)]
    [InlineData(MachineRelationType.ParallelWith)]
    public void Constructor_AcceptsAllRelationTypes(MachineRelationType type)
    {
        var act = () => new MachineRelation(MachineId1, MachineId2, type);
        act.Should().NotThrow();
    }
}
