namespace DigitalTwin.Domain.Enums;

/// <summary>Describes the nature of the directional relation between two machines.</summary>
public enum MachineRelationType
{
    /// <summary>Source machine outputs material that becomes input for target machine.</summary>
    Feeds       = 0,
    DependsOn   = 1,
    ParallelWith = 2
}
