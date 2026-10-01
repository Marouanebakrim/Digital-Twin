using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Interfaces;
using DigitalTwin.Domain.Entities;
using DigitalTwin.Domain.Enums;
using DigitalTwin.Domain.Events;
using DigitalTwin.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace DigitalTwin.Application.Services;

/// <summary>
/// Core Digital Twin processing engine.
///
/// Full pipeline executed for every incoming SensorReading:
///
///   1. Validate: sensor exists and is active
///   2. Evaluate anomaly via IAnomalyDetectionService (Normal / Warning / Critical)
///   3. Persist the SensorReading (immutable, append-only)
///   4. If anomaly detected AND cooldown permits:
///        a. Create an Alert with appropriate severity
///        b. Persist the Alert
///        c. Update machine status (Warning / Critical)
///        d. Persist MachineStateHistory (via Machine.ChangeStatus)
///   5. If reading is normal AND machine was Warning/Critical:
///        Attempt to recover machine status to Running
///   6. Commit everything via SaveChangesAsync
///   7. AFTER successful commit: publish domain events → SignalR
///
/// The engine is registered as Scoped so it shares the same DbContext transaction.
/// The AlertCooldownService is Singleton (in-memory, thread-safe).
/// </summary>
public sealed class DigitalTwinEngine : IDigitalTwinEngine
{
    private readonly ISensorRepository _sensorRepo;
    private readonly ISensorReadingRepository _readingRepo;
    private readonly IMachineRepository _machineRepo;
    private readonly IAlertRepository _alertRepo;
    private readonly IAnomalyDetectionService _anomalyService;
    private readonly IAlertCooldownService _cooldown;
    private readonly ISignalRNotificationService _signalR;
    private readonly IPublisher _publisher;
    private readonly ILogger<DigitalTwinEngine> _logger;

    public DigitalTwinEngine(
        ISensorRepository sensorRepo,
        ISensorReadingRepository readingRepo,
        IMachineRepository machineRepo,
        IAlertRepository alertRepo,
        IAnomalyDetectionService anomalyService,
        IAlertCooldownService cooldown,
        ISignalRNotificationService signalR,
        IPublisher publisher,
        ILogger<DigitalTwinEngine> logger)
    {
        _sensorRepo    = sensorRepo;
        _readingRepo   = readingRepo;
        _machineRepo   = machineRepo;
        _alertRepo     = alertRepo;
        _anomalyService = anomalyService;
        _cooldown      = cooldown;
        _signalR       = signalR;
        _publisher     = publisher;
        _logger        = logger;
    }

    // ─── ProcessReadingAsync ──────────────────────────────────────────────────

    public async Task<SensorReadingDto> ProcessReadingAsync(
        Guid sensorId,
        double value,
        DateTime? timestamp = null,
        CancellationToken cancellationToken = default)
    {
        // ── 1. Load Sensor ──────────────────────────────────────────────────
        var sensor = await _sensorRepo.GetByIdWithMachineAsync(sensorId, cancellationToken)
            ?? throw new KeyNotFoundException($"Sensor {sensorId} not found.");

        if (!sensor.IsActive)
            throw new InvalidOperationException($"Sensor '{sensor.Code}' is not active.");

        var ts = timestamp ?? DateTime.UtcNow;

        // ── 2. Anomaly evaluation ────────────────────────────────────────────
        var anomaly = _anomalyService.Evaluate(value, sensor.MinValue, sensor.MaxValue, sensor.Code);

        var quality   = anomaly.IsAnomaly ? ReadingQuality.Bad : ReadingQuality.Good;
        var isAnomaly = anomaly.IsAnomaly;

        // ── 3. Persist reading ────────────────────────────────────────────────
        var reading = new SensorReading(sensor.Id, value, ts, quality, isAnomaly);
        await _readingRepo.AddAsync(reading, cancellationToken);

        // ── 4. Load machine (needed for status / alert) ───────────────────────
        var machine = await _machineRepo.GetByIdAsync(sensor.MachineId, cancellationToken)
            ?? throw new InvalidOperationException($"Machine {sensor.MachineId} not found for sensor '{sensor.Code}'.");

        Alert? newAlert = null;

        if (isAnomaly)
        {
            var severity = anomaly.Severity!.Value;

            if (_cooldown.ShouldRaiseAlert(sensor.Id, severity))
            {
                // ── 4a. Create alert ─────────────────────────────────────────
                var alertTitle = $"[{severity}] {sensor.Name} threshold exceeded";
                var alertMsg   = BuildAlertMessage(sensor, value, severity, anomaly.DeviationPercent);

                newAlert = new Alert(
                    machine.Id,
                    sensor.Id,
                    severity,
                    AlertType.SensorThreshold,
                    alertTitle,
                    alertMsg);

                await _alertRepo.AddAsync(newAlert, cancellationToken);

                // ── 4b. Update machine status ───────────────────────────────
                var targetStatus = severity == AlertSeverity.Critical
                    ? MachineStatus.Critical
                    : MachineStatus.Warning;

                if (machine.Status != targetStatus &&
                    (targetStatus == MachineStatus.Critical || machine.Status == MachineStatus.Running))
                {
                    machine.ChangeStatus(targetStatus,
                        $"Auto: {severity} alert on sensor '{sensor.Code}'");
                }

                _logger.LogWarning(
                    "Alert [{Severity}] raised for sensor {SensorCode} on machine {MachineCode}. Value={Value} Dev={Dev:F1}%",
                    severity, sensor.Code, machine.Code, value, anomaly.DeviationPercent);
            }
        }
        else
        {
            // Reading is normal → reset cooldown
            _cooldown.Reset(sensor.Id);

            // Auto-resolve open threshold alerts for this sensor
            var machineAlerts = await _alertRepo.GetAllAsync(
                acknowledged: null,
                machineId: machine.Id,
                severity: null,
                ct: cancellationToken);

            var openSensorAlerts = machineAlerts
                .Where(a => a.SensorId == sensor.Id && a.IsOpen && a.Type == AlertType.SensorThreshold)
                .ToList();

            foreach (var openAlert in openSensorAlerts)
            {
                openAlert.Resolve();
                _alertRepo.Update(openAlert);
                _logger.LogInformation(
                    "Auto-resolved alert {AlertId} for sensor '{SensorCode}' (returned to normal range).",
                    openAlert.Id, sensor.Code);
            }

            // Auto-recover machine: if machine was in Warning or Critical and all open alerts are resolved
            if (machine.Status is MachineStatus.Warning or MachineStatus.Critical)
            {
                var remainingOpenAlerts = machineAlerts
                    .Count(a => a.IsOpen && !openSensorAlerts.Contains(a));

                if (remainingOpenAlerts == 0)
                {
                    machine.ChangeStatus(MachineStatus.Running,
                        $"Auto-recovery: sensor '{sensor.Code}' returned to normal operating range");

                    _logger.LogInformation(
                        "Machine {MachineCode} auto-recovered to Running (all sensor alerts resolved).",
                        machine.Code);
                }
            }
        }

        // ── 5. Commit everything in one call ─────────────────────────────────
        // MachineStateHistory is appended by Machine.ChangeStatus → tracked by EF
        _machineRepo.Update(machine);
        await _readingRepo.SaveChangesAsync(cancellationToken);

        // ── 6. Publish real-time events AFTER successful commit ───────────────
        var readingDto = ToReadingDto(reading, sensor);

        SensorReadingAlertInfo? alertInfo = newAlert == null ? null : new SensorReadingAlertInfo(
            newAlert.Id,
            newAlert.Severity.ToString(),
            newAlert.Title,
            newAlert.Message);

        var payload = new SensorReadingUpdatePayload(
            machine.Id,
            machine.Code,
            sensor.Id,
            sensor.SensorType,
            reading.Value,
            sensor.Unit,
            reading.Timestamp,
            machine.Status.ToString(),
            alertInfo);

        await _signalR.SendSensorReadingUpdatedAsync(payload, cancellationToken);

        // Also publish dynamic MachineStateUpdated event
        var currentState = await GetCurrentStateAsync(machine.Id, cancellationToken);
        await _signalR.SendMachineStateUpdatedAsync(currentState, cancellationToken);

        if (machine.DomainEvents.Any())
        {
            foreach (var evt in machine.DomainEvents)
                await _publisher.Publish(evt, cancellationToken);
            machine.ClearDomainEvents();
        }

        if (newAlert != null)
        {
            await _publisher.Publish(new AlertCreatedEvent(
                newAlert.Id,
                machine.Id,
                machine.Code,
                sensor.Id,
                newAlert.Severity,
                newAlert.Type,
                newAlert.Title,
                newAlert.Message,
                newAlert.CreatedAt), cancellationToken);
        }

        return readingDto;
    }

    // ─── GetCurrentStateAsync ─────────────────────────────────────────────────

    public async Task<CurrentMachineStateDto> GetCurrentStateAsync(
        Guid machineId,
        CancellationToken cancellationToken = default)
    {
        var machine = await _machineRepo.GetByIdWithSensorsAsync(machineId, cancellationToken)
            ?? throw new KeyNotFoundException($"Machine {machineId} not found.");

        var sensorValues = new List<SensorCurrentValueDto>();

        foreach (var sensor in machine.Sensors.Where(s => s.IsActive))
        {
            var latest = await _readingRepo.GetLatestBySensorIdAsync(sensor.Id, cancellationToken);
            if (latest is null) continue;

            var anomaly = _anomalyService.Evaluate(latest.Value, sensor.MinValue, sensor.MaxValue, sensor.Code);

            sensorValues.Add(new SensorCurrentValueDto(
                sensor.Id,
                sensor.Code,
                sensor.Name,
                sensor.SensorType,
                sensor.Unit,
                latest.Value,
                latest.Timestamp,
                latest.Quality.ToString(),
                latest.IsAnomaly,
                anomaly.Severity?.ToString(),
                sensor.MinValue,
                sensor.MaxValue));
        }

        var activeAlerts   = await _alertRepo.CountOpenAsync(machineId, cancellationToken);
        var criticalAlerts = await _alertRepo.GetAllAsync(false, machineId, AlertSeverity.Critical, cancellationToken);

        return new CurrentMachineStateDto(
            machine.Id,
            machine.Code,
            machine.Name,
            machine.Type.ToString(),
            machine.Status.ToString(),
            DateTime.UtcNow,
            sensorValues.AsReadOnly(),
            activeAlerts,
            criticalAlerts.Count);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static SensorReadingDto ToReadingDto(SensorReading reading, Domain.Entities.Sensor sensor)
        => new(reading.Id, reading.SensorId, reading.Value, sensor.Unit,
               reading.Timestamp, reading.Quality.ToString(), reading.IsAnomaly);

    private static string BuildAlertMessage(
        Domain.Entities.Sensor sensor,
        double value,
        AlertSeverity severity,
        double deviationPercent)
    {
        var direction = sensor.MaxValue.HasValue && value > sensor.MaxValue.Value ? "above maximum" : "below minimum";
        var threshold = sensor.MaxValue.HasValue && value > sensor.MaxValue.Value
            ? sensor.MaxValue.Value
            : sensor.MinValue!.Value;

        return $"Sensor '{sensor.Code}' ({sensor.Name}) reported {value:F2} {sensor.Unit}, " +
               $"which is {deviationPercent:F1}% {direction} threshold ({threshold:F2} {sensor.Unit}). " +
               $"Severity: {severity}.";
    }
}
