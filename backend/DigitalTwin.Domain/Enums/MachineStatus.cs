namespace DigitalTwin.Domain.Enums;

/// <summary>Operational status of a machine.</summary>
public enum MachineStatus
{
    Stopped = 0,
    Running = 1,
    Warning = 2,
    Critical = 3,
    Maintenance = 4
}
