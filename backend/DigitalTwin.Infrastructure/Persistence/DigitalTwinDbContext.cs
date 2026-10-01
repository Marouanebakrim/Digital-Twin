using DigitalTwin.Domain.Common;
using DigitalTwin.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DigitalTwin.Infrastructure.Persistence;

public class DigitalTwinDbContext : DbContext
{
    public DigitalTwinDbContext(DbContextOptions<DigitalTwinDbContext> options)
        : base(options)
    {
    }

    public DbSet<Plant> Plants => Set<Plant>();
    public DbSet<ProductionLine> ProductionLines => Set<ProductionLine>();
    public DbSet<Machine> Machines => Set<Machine>();
    public DbSet<Sensor> Sensors => Set<Sensor>();
    public DbSet<SensorReading> SensorReadings => Set<SensorReading>();
    public DbSet<Alert> Alerts => Set<Alert>();
    public DbSet<MachineStateHistory> MachineStateHistories => Set<MachineStateHistory>();
    public DbSet<MachineRelation> MachineRelations => Set<MachineRelation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all entity configurations in this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(DigitalTwinDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Entity.Id == Guid.Empty)
                {
                    entry.Entity.Id = Guid.NewGuid();
                }
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
