namespace DigitalTwin.Simulator.Profiles;

/// <summary>
/// In-memory profile for a single machine, holding its sensors' metadata.
/// Built at startup from the API and reused throughout the simulator lifetime.
/// </summary>
public sealed class MachineSimProfile
{
    public Guid MachineId { get; }
    public string Code { get; }
    public string Name { get; }
    public List<SensorResponse> Sensors { get; }

    public MachineSimProfile(Guid machineId, string code, string name, List<SensorResponse> sensors)
    {
        MachineId = machineId;
        Code = code;
        Name = name;
        Sensors = sensors;
    }
}

/// <summary>Minimal sensor descriptor returned by GET /api/machines/{id}/sensors.</summary>
public sealed record SensorResponse(
    Guid Id,
    Guid MachineId,
    string Code,
    string Name,
    string SensorType,
    string Unit,
    double? MinValue,
    double? MaxValue,
    double? MinWarning,
    double? MaxWarning,
    bool IsActive,
    object? LatestReading);
