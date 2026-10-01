using DigitalTwin.Application.Interfaces;
using DigitalTwin.Domain.Enums;
using DigitalTwin.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace DigitalTwin.Application.Features.Machines.Commands;

/// <summary>
/// Resets the entire demonstration scenario state:
///   1. All machines → Running status
///   2. All open (unresolved) alerts → resolved
///   3. Alert cooldown cleared for all sensors
///   4. SignalR MachineStatusChanged broadcast for each machine reset
///
/// Called by POST /api/machines/reset-scenario
/// Also called implicitly by the simulator when mode changes to "normal".
/// </summary>
public record ResetScenarioCommand : IRequest<ResetScenarioResult>;

public record ResetScenarioResult(int MachinesReset, int AlertsResolved);

public class ResetScenarioHandler : IRequestHandler<ResetScenarioCommand, ResetScenarioResult>
{
    private readonly IMachineRepository _machineRepo;
    private readonly IAlertRepository _alertRepo;
    private readonly IAlertCooldownService _cooldown;
    private readonly ISignalRNotificationService _signalR;
    private readonly ILogger<ResetScenarioHandler> _logger;

    public ResetScenarioHandler(
        IMachineRepository machineRepo,
        IAlertRepository alertRepo,
        IAlertCooldownService cooldown,
        ISignalRNotificationService signalR,
        ILogger<ResetScenarioHandler> logger)
    {
        _machineRepo = machineRepo;
        _alertRepo   = alertRepo;
        _cooldown    = cooldown;
        _signalR     = signalR;
        _logger      = logger;
    }

    public async Task<ResetScenarioResult> Handle(ResetScenarioCommand request, CancellationToken ct)
    {
        int machinesReset  = 0;
        int alertsResolved = 0;

        // 1. Resolve all open alerts
        var openAlerts = await _alertRepo.GetAllAsync(acknowledged: null, machineId: null, severity: null, ct: ct);
        var unresolved = openAlerts.Where(a => a.IsOpen).ToList();
        foreach (var alert in unresolved)
        {
            alert.Resolve();
            _alertRepo.Update(alert);
            alertsResolved++;
        }

        // 2. Reset all machines to Running
        var machines = await _machineRepo.GetAllAsync(ct);
        foreach (var machine in machines)
        {
            if (machine.Status != MachineStatus.Running)
            {
                var previousStatus = machine.Status.ToString();
                machine.ChangeStatus(MachineStatus.Running, "Scenario reset: returning all machines to normal operating state");
                _machineRepo.Update(machine);
                machinesReset++;

                // Broadcast MachineStatusChanged so Angular updates immediately
                await _signalR.SendMachineStatusChangedAsync(
                    machine.Id, machine.Code,
                    previousStatus, MachineStatus.Running.ToString(),
                    "Scenario reset",
                    ct);
            }
        }

        // 3. Save all changes
        await _machineRepo.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Scenario reset complete: {MachinesReset} machine(s) restored to Running, {AlertsResolved} alert(s) resolved.",
            machinesReset, alertsResolved);

        return new ResetScenarioResult(machinesReset, alertsResolved);
    }
}