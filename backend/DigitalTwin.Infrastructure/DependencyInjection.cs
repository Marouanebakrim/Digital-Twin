using DigitalTwin.Application.Interfaces;
using DigitalTwin.Domain.Interfaces;
using DigitalTwin.Infrastructure.Persistence;
using DigitalTwin.Infrastructure.Repositories;
using DigitalTwin.Infrastructure.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DigitalTwin.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Server=(localdb)\\mssqllocaldb;Database=DigitalTwinDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";

        services.AddDbContext<DigitalTwinDbContext>(options =>
            options.UseSqlServer(connectionString, b => b.MigrationsAssembly("DigitalTwin.Infrastructure")));

        // Repositories
        services.AddScoped<IPlantRepository, PlantRepository>();
        services.AddScoped<IProductionLineRepository, ProductionLineRepository>();
        services.AddScoped<IMachineRepository, MachineRepository>();
        services.AddScoped<ISensorRepository, SensorRepository>();
        services.AddScoped<ISensorReadingRepository, SensorReadingRepository>();
        services.AddScoped<IAlertRepository, AlertRepository>();
        services.AddScoped<IMachineRelationRepository, MachineRelationRepository>();

        // SignalR Service
        services.AddSignalR();
        services.AddScoped<ISignalRNotificationService, SignalRNotificationService>();

        // MediatR notification handlers in this assembly
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
        });

        return services;
    }
}
