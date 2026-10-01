using DigitalTwin.Domain.Entities;
using DigitalTwin.Domain.Enums;

namespace DigitalTwin.Domain.Interfaces;

// ─── Plant ────────────────────────────────────────────────────────────────────

public interface IPlantRepository
{
    Task<Plant?>              GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Plant>> GetAllAsync(CancellationToken ct = default);
    Task<Plant>               AddAsync(Plant plant, CancellationToken ct = default);
    void                      Update(Plant plant);
    Task                      SaveChangesAsync(CancellationToken ct = default);
}

// ─── ProductionLine ───────────────────────────────────────────────────────────

public interface IProductionLineRepository
{
    Task<ProductionLine?>              GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<ProductionLine>> GetByPlantIdAsync(Guid plantId, CancellationToken ct = default);
    Task<ProductionLine>               AddAsync(ProductionLine line, CancellationToken ct = default);
    Task                               SaveChangesAsync(CancellationToken ct = default);
}

// ─── Machine ──────────────────────────────────────────────────────────────────

public interface IMachineRepository
{
    Task<Machine?>              GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Machine?>              GetByIdWithSensorsAsync(Guid id, CancellationToken ct = default);
    Task<Machine?>              GetByCodeAsync(string code, CancellationToken ct = default);
    Task<IReadOnlyList<Machine>> GetAllAsync(CancellationToken ct = default);
    Task<IReadOnlyList<Machine>> GetAllWithSensorsAsync(CancellationToken ct = default);
    Task<Machine>               AddAsync(Machine machine, CancellationToken ct = default);
    void                         Update(Machine machine);
    void                         Delete(Machine machine);
    Task                         SaveChangesAsync(CancellationToken ct = default);
}

// ─── Sensor ───────────────────────────────────────────────────────────────────

public interface ISensorRepository
{
    Task<Sensor?>              GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Sensor?>              GetByIdWithMachineAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Sensor>> GetByMachineIdAsync(Guid machineId, CancellationToken ct = default);
    Task<Sensor>               AddAsync(Sensor sensor, CancellationToken ct = default);
    void                        Update(Sensor sensor);
    void                        Delete(Sensor sensor);
    Task                        SaveChangesAsync(CancellationToken ct = default);
}

// ─── SensorReading ────────────────────────────────────────────────────────────

public interface ISensorReadingRepository
{
    Task<SensorReading>              AddAsync(SensorReading reading, CancellationToken ct = default);
    Task<SensorReading?>             GetLatestBySensorIdAsync(Guid sensorId, CancellationToken ct = default);
    Task<IReadOnlyList<SensorReading>> GetBySensorIdAsync(
        Guid sensorId, DateTime from, DateTime to,
        int pageSize = 500, CancellationToken ct = default);
    Task<IReadOnlyList<SensorReading>> GetByMachineIdAsync(
        Guid machineId, DateTime from, DateTime to,
        int pageSize = 500, CancellationToken ct = default);
    Task                             SaveChangesAsync(CancellationToken ct = default);
}

// ─── Alert ────────────────────────────────────────────────────────────────────

public interface IAlertRepository
{
    Task<Alert?>              GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Alert>> GetAllAsync(
        bool? acknowledged = null,
        Guid? machineId    = null,
        AlertSeverity? severity = null,
        CancellationToken ct = default);
    Task<int>                 CountOpenAsync(Guid? machineId = null, CancellationToken ct = default);
    Task<Alert>               AddAsync(Alert alert, CancellationToken ct = default);
    void                      Update(Alert alert);
    Task                      SaveChangesAsync(CancellationToken ct = default);
}

// ─── MachineRelation ─────────────────────────────────────────────────────────

public interface IMachineRelationRepository
{
    Task<IReadOnlyList<MachineRelation>> GetByMachineIdAsync(Guid machineId, CancellationToken ct = default);
    Task<IReadOnlyList<MachineRelation>> GetAllAsync(CancellationToken ct = default);
    Task<MachineRelation>                AddAsync(MachineRelation relation, CancellationToken ct = default);
    Task                                 SaveChangesAsync(CancellationToken ct = default);
}
