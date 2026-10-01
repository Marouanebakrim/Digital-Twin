namespace DigitalTwin.Domain.Enums;

/// <summary>Categorises the business cause of an alert.</summary>
public enum AlertType
{
    SensorThreshold = 0,
    AnomalyDetected = 1,
    MachineDown     = 2,
    Communication   = 3
}
