using DigitalTwin.Domain.Entities;
using DigitalTwin.Domain.Interfaces;
using DigitalTwin.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DigitalTwin.Infrastructure.Repositories;

public class PlantRepository : IPlantRepository
{
    private readonly DigitalTwinDbContext _context;

    public PlantRepository(DigitalTwinDbContext context) => _context = context;

    public async Task<Plant?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _context.Plants
            .Include(p => p.ProductionLines)
                .ThenInclude(pl => pl.Machines)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<IReadOnlyList<Plant>> GetAllAsync(CancellationToken ct = default)
        => await _context.Plants
            .Include(p => p.ProductionLines)
                .ThenInclude(pl => pl.Machines)
            .ToListAsync(ct);

    public async Task<Plant> AddAsync(Plant plant, CancellationToken ct = default)
    {
        await _context.Plants.AddAsync(plant, ct);
        return plant;
    }

    public void Update(Plant plant)
    {
        if (_context.Entry(plant).State == EntityState.Detached)
            _context.Plants.Update(plant);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}

public class ProductionLineRepository : IProductionLineRepository
{
    private readonly DigitalTwinDbContext _context;

    public ProductionLineRepository(DigitalTwinDbContext context) => _context = context;

    public async Task<ProductionLine?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _context.ProductionLines
            .Include(pl => pl.Machines)
            .FirstOrDefaultAsync(pl => pl.Id == id, ct);

    public async Task<IReadOnlyList<ProductionLine>> GetByPlantIdAsync(Guid plantId, CancellationToken ct = default)
    {
        var query = _context.ProductionLines.Include(pl => pl.Machines).AsQueryable();
        if (plantId != Guid.Empty)
            query = query.Where(pl => pl.PlantId == plantId);

        return await query.ToListAsync(ct);
    }

    public async Task<ProductionLine> AddAsync(ProductionLine line, CancellationToken ct = default)
    {
        await _context.ProductionLines.AddAsync(line, ct);
        return line;
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}

public class MachineRepository : IMachineRepository
{
    private readonly DigitalTwinDbContext _context;

    public MachineRepository(DigitalTwinDbContext context) => _context = context;

    public async Task<Machine?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _context.Machines
            .Include(m => m.Sensors)
            .Include(m => m.StateHistory)
            .FirstOrDefaultAsync(m => m.Id == id, ct);

    public async Task<Machine?> GetByIdWithSensorsAsync(Guid id, CancellationToken ct = default)
        => await _context.Machines
            .Include(m => m.Sensors)
            .Include(m => m.StateHistory)
            .Include(m => m.RelationsOut)
            .Include(m => m.RelationsIn)
            .FirstOrDefaultAsync(m => m.Id == id, ct);

    public async Task<Machine?> GetByCodeAsync(string code, CancellationToken ct = default)
        => await _context.Machines
            .Include(m => m.Sensors)
            .Include(m => m.StateHistory)
            .FirstOrDefaultAsync(m => m.Code == code, ct);

    public async Task<IReadOnlyList<Machine>> GetAllAsync(CancellationToken ct = default)
        => await _context.Machines.ToListAsync(ct);

    public async Task<IReadOnlyList<Machine>> GetAllWithSensorsAsync(CancellationToken ct = default)
        => await _context.Machines
            .Include(m => m.Sensors)
            .Include(m => m.StateHistory)
            .ToListAsync(ct);

    public async Task<Machine> AddAsync(Machine machine, CancellationToken ct = default)
    {
        await _context.Machines.AddAsync(machine, ct);
        return machine;
    }

    public void Update(Machine machine)
    {
        if (_context.Entry(machine).State == EntityState.Detached)
            _context.Machines.Update(machine);
    }

    public void Delete(Machine machine) => _context.Machines.Remove(machine);

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}

public class SensorRepository : ISensorRepository
{
    private readonly DigitalTwinDbContext _context;

    public SensorRepository(DigitalTwinDbContext context) => _context = context;

    public async Task<Sensor?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _context.Sensors.FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task<Sensor?> GetByIdWithMachineAsync(Guid id, CancellationToken ct = default)
        => await _context.Sensors
            .Include(s => s.Machine)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task<IReadOnlyList<Sensor>> GetByMachineIdAsync(Guid machineId, CancellationToken ct = default)
        => await _context.Sensors
            .Where(s => s.MachineId == machineId)
            .ToListAsync(ct);

    public async Task<Sensor> AddAsync(Sensor sensor, CancellationToken ct = default)
    {
        await _context.Sensors.AddAsync(sensor, ct);
        return sensor;
    }

    public void Update(Sensor sensor)
    {
        if (_context.Entry(sensor).State == EntityState.Detached)
            _context.Sensors.Update(sensor);
    }

    public void Delete(Sensor sensor) => _context.Sensors.Remove(sensor);

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}

public class SensorReadingRepository : ISensorReadingRepository
{
    private readonly DigitalTwinDbContext _context;

    public SensorReadingRepository(DigitalTwinDbContext context) => _context = context;

    public async Task<SensorReading> AddAsync(SensorReading reading, CancellationToken ct = default)
    {
        await _context.SensorReadings.AddAsync(reading, ct);
        return reading;
    }

    public async Task<SensorReading?> GetLatestBySensorIdAsync(Guid sensorId, CancellationToken ct = default)
        => await _context.SensorReadings
            .Where(r => r.SensorId == sensorId)
            .OrderByDescending(r => r.Timestamp)
            .FirstOrDefaultAsync(ct);

    public async Task<IReadOnlyList<SensorReading>> GetBySensorIdAsync(
        Guid sensorId, DateTime from, DateTime to,
        int pageSize = 500, CancellationToken ct = default)
        => await _context.SensorReadings
            .Where(r => r.SensorId == sensorId && r.Timestamp >= from && r.Timestamp <= to)
            .OrderByDescending(r => r.Timestamp)
            .Take(pageSize)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<SensorReading>> GetByMachineIdAsync(
        Guid machineId, DateTime from, DateTime to,
        int pageSize = 500, CancellationToken ct = default)
    {
        var sensorIds = await _context.Sensors
            .Where(s => s.MachineId == machineId)
            .Select(s => s.Id)
            .ToListAsync(ct);

        return await _context.SensorReadings
            .Where(r => sensorIds.Contains(r.SensorId) && r.Timestamp >= from && r.Timestamp <= to)
            .OrderByDescending(r => r.Timestamp)
            .Take(pageSize)
            .ToListAsync(ct);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}

public class AlertRepository : IAlertRepository
{
    private readonly DigitalTwinDbContext _context;

    public AlertRepository(DigitalTwinDbContext context) => _context = context;

    public async Task<Alert?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _context.Alerts
            .Include(a => a.Machine)
            .Include(a => a.Sensor)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

    public async Task<IReadOnlyList<Alert>> GetAllAsync(
        bool? acknowledged = null,
        Guid? machineId = null,
        Domain.Enums.AlertSeverity? severity = null,
        CancellationToken ct = default)
    {
        var query = _context.Alerts
            .Include(a => a.Machine)
            .Include(a => a.Sensor)
            .AsQueryable();

        if (acknowledged.HasValue)
            query = query.Where(a => a.IsAcknowledged == acknowledged.Value);

        if (machineId.HasValue)
            query = query.Where(a => a.MachineId == machineId.Value);

        if (severity.HasValue)
            query = query.Where(a => a.Severity == severity.Value);

        return await query
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<int> CountOpenAsync(Guid? machineId = null, CancellationToken ct = default)
    {
        var query = _context.Alerts.Where(a => a.ResolvedAt == null);
        if (machineId.HasValue)
            query = query.Where(a => a.MachineId == machineId.Value);

        return await query.CountAsync(ct);
    }

    public async Task<Alert> AddAsync(Alert alert, CancellationToken ct = default)
    {
        await _context.Alerts.AddAsync(alert, ct);
        return alert;
    }

    public void Update(Alert alert)
    {
        if (_context.Entry(alert).State == EntityState.Detached)
            _context.Alerts.Update(alert);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}

public class MachineRelationRepository : IMachineRelationRepository
{
    private readonly DigitalTwinDbContext _context;

    public MachineRelationRepository(DigitalTwinDbContext context) => _context = context;

    public async Task<IReadOnlyList<MachineRelation>> GetByMachineIdAsync(Guid machineId, CancellationToken ct = default)
        => await _context.MachineRelations
            .Include(mr => mr.SourceMachine)
            .Include(mr => mr.TargetMachine)
            .Where(mr => mr.SourceMachineId == machineId || mr.TargetMachineId == machineId)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<MachineRelation>> GetAllAsync(CancellationToken ct = default)
        => await _context.MachineRelations
            .Include(mr => mr.SourceMachine)
            .Include(mr => mr.TargetMachine)
            .ToListAsync(ct);

    public async Task<MachineRelation> AddAsync(MachineRelation relation, CancellationToken ct = default)
    {
        await _context.MachineRelations.AddAsync(relation, ct);
        return relation;
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}
