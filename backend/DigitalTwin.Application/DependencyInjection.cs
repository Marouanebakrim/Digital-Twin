using DigitalTwin.Application.Interfaces;
using DigitalTwin.Application.Services;
using DigitalTwin.Application.Validators;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace DigitalTwin.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // MediatR — scan all handlers in this assembly
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
        });

        // FluentValidation
        services.AddValidatorsFromAssemblyContaining<SubmitReadingValidator>();

        // Digital Twin Engine (Scoped — shares DbContext within a request)
        services.AddScoped<IDigitalTwinEngine, DigitalTwinEngine>();

        // Impact Analysis Service (Scoped — multi-level relation traversal)
        services.AddScoped<IImpactAnalysisService, ImpactAnalysisService>();

        // Anomaly detection (stateless → Singleton)
        services.AddSingleton<IAnomalyDetectionService, AnomalyDetectionService>();

        // Alert cooldown tracker (Singleton — in-memory state must survive across requests)
        services.AddSingleton<IAlertCooldownService, AlertCooldownService>();

        return services;
    }
}
