using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace DigitalTwin.Infrastructure.Persistence;

public class DigitalTwinDbContextFactory : IDesignTimeDbContextFactory<DigitalTwinDbContext>
{
    public DigitalTwinDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<DigitalTwinDbContext>();

        var connectionString = "Server=(localdb)\\mssqllocaldb;Database=DigitalTwinDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";

        optionsBuilder.UseSqlServer(connectionString, b => b.MigrationsAssembly("DigitalTwin.Infrastructure"));

        return new DigitalTwinDbContext(optionsBuilder.Options);
    }
}
