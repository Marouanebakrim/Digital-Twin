using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace DigitalTwin.Infrastructure.SignalR;

/// <summary>
/// Infrastructure implementation of ISignalRNotificationService.
/// Dispatches real-time events to connected clients via SignalR groups.
///
/// Available events:
///   • SensorReadingUpdated  (and alias SensorReadingReceived)
///   • MachineStateUpdated
///   • AlertCreated
///   • MachineStatusChanged
///   • AlertAcknowledged
///   • DashboardUpdated
///   • PotentialImpactDetected (and alias ImpactAnalysisDetected)
/// </summary>
public class SignalRNotificationService : ISignalRNotificationService
{
    private readonly IHubContext<DigitalTwinHub> _hubContext;

    public SignalRNotificationService(IHubContext<DigitalTwinHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendSensorReadingUpdatedAsync(SensorReadingUpdatePayload payload, CancellationToken ct = default)
    {
        // Broadcast to machine-specific group, alerts group, and dashboard group
        await _hubContext.Clients.Group($"machine:{payload.MachineCode}")
            .SendAsync("SensorReadingUpdated", payload, cancellationToken: ct);

        // Also broadcast alias for backwards compatibility
        await _hubContext.Clients.Group($"machine:{payload.MachineCode}")
            .SendAsync("SensorReadingReceived", payload, cancellationToken: ct);

        await _hubContext.Clients.Group("dashboard")
            .SendAsync("SensorReadingUpdated", payload, cancellationToken: ct);
    }

    public async Task SendMachineStateUpdatedAsync(CurrentMachineStateDto state, CancellationToken ct = default)
    {
        await _hubContext.Clients.Group($"machine:{state.MachineCode}")
            .SendAsync("MachineStateUpdated", state, cancellationToken: ct);

        await _hubContext.Clients.Group("dashboard")
            .SendAsync("MachineStateUpdated", state, cancellationToken: ct);
    }

    public async Task SendMachineStatusChangedAsync(
        Guid machineId, string machineCode, string previousStatus, string newStatus, string? reason,
        CancellationToken ct = default)
    {
        var payload = new
        {
            machineId,
            machineCode,
            previousStatus,
            newStatus,
            reason,
            changedAt = DateTime.UtcNow
        };

        await _hubContext.Clients.All
            .SendAsync("MachineStatusChanged", payload, cancellationToken: ct);
    }

    public async Task SendAlertCreatedAsync(AlertDto alert, CancellationToken ct = default)
    {
        await _hubContext.Clients.Group("alerts")
            .SendAsync("AlertCreated", alert, cancellationToken: ct);

        await _hubContext.Clients.Group("dashboard")
            .SendAsync("AlertCreated", alert, cancellationToken: ct);
    }

    public async Task SendAlertAcknowledgedAsync(
        Guid alertId, DateTime acknowledgedAt, string acknowledgedBy,
        CancellationToken ct = default)
    {
        var payload = new { alertId, acknowledgedAt, acknowledgedBy };

        await _hubContext.Clients.All
            .SendAsync("AlertAcknowledged", payload, cancellationToken: ct);
    }

    public async Task SendDashboardUpdatedAsync(DashboardSummaryDto summary, CancellationToken ct = default)
    {
        await _hubContext.Clients.Group("dashboard")
            .SendAsync("DashboardUpdated", summary, cancellationToken: ct);
    }

    public async Task SendPotentialImpactDetectedAsync(ImpactAnalysisResultDto result, CancellationToken ct = default)
    {
        // Broadcast to dashboard and alerts groups
        await _hubContext.Clients.Group("dashboard")
            .SendAsync("PotentialImpactDetected", result, cancellationToken: ct);

        await _hubContext.Clients.Group("alerts")
            .SendAsync("PotentialImpactDetected", result, cancellationToken: ct);

        // Also broadcast to root machine group and all impacted machine groups
        await _hubContext.Clients.Group($"machine:{result.RootMachineCode}")
            .SendAsync("PotentialImpactDetected", result, cancellationToken: ct);

        foreach (var impacted in result.ImpactedMachines)
        {
            await _hubContext.Clients.Group($"machine:{impacted.MachineCode}")
                .SendAsync("PotentialImpactDetected", result, cancellationToken: ct);
        }

        // Backward-compatible alias
        await _hubContext.Clients.Group("dashboard")
            .SendAsync("ImpactAnalysisDetected", result, cancellationToken: ct);
    }
}

/// <summary>
/// SignalR Hub for real-time Digital Twin subscriptions.
/// Endpoint: /hubs/digital-twin
/// </summary>
public class DigitalTwinHub : Hub
{
    public async Task JoinMachineGroup(string machineCode)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"machine:{machineCode}");
    }

    public async Task LeaveMachineGroup(string machineCode)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"machine:{machineCode}");
    }

    public async Task JoinDashboardGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "dashboard");
    }

    public async Task JoinAlertsGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "alerts");
    }
}
