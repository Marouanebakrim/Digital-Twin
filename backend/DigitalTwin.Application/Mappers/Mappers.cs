using DigitalTwin.Application.DTOs;
using DigitalTwin.Domain.Entities;

namespace DigitalTwin.Application.Mappers;

public static class MachineMapper
{
    public static MachineSummaryDto ToSummaryDto(Machine machine, int activeAlerts) =>
        new(machine.Id, machine.Code, machine.Name, machine.Type.ToString(),
            machine.Status.ToString(), activeAlerts, machine.Sensors.Count);

    public static MachineDetailDto ToDetailDto(Machine machine,
        IEnumerable<SensorDto> sensors, IEnumerable<MachineRelation> relations) =>
        new(machine.Id, machine.Code, machine.Name, machine.Type.ToString(),
            machine.Status.ToString(), machine.Description, machine.Location,
            machine.InstalledAt, machine.CreatedAt, sensors,
            relations.Select(r => new MachineRelationDto(r.Id,
                r.SourceMachineId, r.SourceMachine?.Code ?? string.Empty, r.SourceMachine?.Name ?? string.Empty,
                r.TargetMachineId, r.TargetMachine?.Code ?? string.Empty, r.TargetMachine?.Name ?? string.Empty,
                r.RelationType.ToString(), r.Description)));
}

public static class SensorMapper
{
    public static SensorDto ToDto(Sensor sensor, SensorReading? latestReading) =>
        new(sensor.Id, sensor.MachineId, sensor.Code, sensor.Name,
            sensor.SensorType, sensor.Unit,
            sensor.MinValue, sensor.MaxValue, null, null,
            sensor.IsActive,
            latestReading is null ? null : ReadingToDto(latestReading, sensor.Unit));

    public static SensorReadingDto ReadingToDto(SensorReading reading, string unit) =>
        new(reading.Id, reading.SensorId, reading.Value, unit,
            reading.Timestamp, reading.Quality.ToString(), reading.IsAnomaly);
}

public static class AlertMapper
{
    public static AlertDto ToDto(Alert alert) =>
        new(alert.Id, alert.MachineId,
            alert.Machine?.Name ?? string.Empty,
            alert.Machine?.Code ?? string.Empty,
            alert.SensorId,
            alert.Sensor?.Name,
            alert.Severity.ToString(), alert.Type.ToString(),
            alert.Title, alert.Message,
            alert.IsAcknowledged, alert.AcknowledgedAt, alert.AcknowledgedBy,
            alert.CreatedAt, alert.ResolvedAt);
}

public static class ProductionLineMapper
{
    public static ProductionLineDto ToDto(ProductionLine line, IEnumerable<MachineSummaryDto> machines) =>
        new(line.Id, line.PlantId, line.Name, line.Description, machines);
}

public static class PlantMapper
{
    public static PlantDto ToDto(Plant plant, IEnumerable<ProductionLineDto> lines) =>
        new(plant.Id, plant.Name, plant.Location, plant.Description, plant.CreatedAt, lines);
}
