namespace DigitalTwin.Domain.Enums;

/// <summary>
/// Logical type of sensor. Stored as a free string in the database to allow
/// adding new sensor types without schema or code changes.
/// This enum provides the well-known types used in the demo plant.
/// </summary>
public enum SensorType
{
    // Mechanical
    Temperature = 0,
    Vibration   = 1,
    Speed       = 2,       // RPM

    // Flow
    MaterialFlow    = 3,   // t/h
    InputFlow       = 4,   // t/h
    OutputFlow      = 5,   // t/h
    AcidFlow        = 6,   // t/h
    PhosphateFlow   = 7,   // t/h

    // Power
    MotorPower  = 8,       // kW

    // Belt
    BeltSpeed   = 9,       // m/s
    BeltLoad    = 10,      // %

    // Process
    Pressure    = 11,      // bar
    PH          = 12,      // pH
    Level       = 13,      // %
    AgitatorSpeed = 14     // RPM
}
