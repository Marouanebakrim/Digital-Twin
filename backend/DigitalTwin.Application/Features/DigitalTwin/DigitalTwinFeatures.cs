using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Mappers;
using DigitalTwin.Domain.Interfaces;
using MediatR;

namespace DigitalTwin.Application.Features.DigitalTwin;

public record GetDigitalTwinMachineStateQuery(Guid MachineId) : IRequest<DigitalTwinStateDto>;

public class GetDigitalTwinMachineStateHandler : IRequestHandler<GetDigitalTwinMachineStateQuery, DigitalTwinStateDto>
{
    private readonly IMachineRepository _machineRepository;
    private readonly ISensorReadingRepository _readingRepository;
    private readonly IAlertRepository _alertRepository;
    private readonly IMachineRelationRepository _relationRepository;

    public GetDigitalTwinMachineStateHandler(
        IMachineRepository machineRepository,
        ISensorReadingRepository readingRepository,
        IAlertRepository alertRepository,
        IMachineRelationRepository relationRepository)
    {
        _machineRepository = machineRepository;
        _readingRepository = readingRepository;
        _alertRepository = alertRepository;
        _relationRepository = relationRepository;
    }

    public async Task<DigitalTwinStateDto> Handle(GetDigitalTwinMachineStateQuery request, CancellationToken ct)
    {
        var machine = await _machineRepository.GetByIdWithSensorsAsync(request.MachineId, ct)
            ?? throw new KeyNotFoundException($"Machine {request.MachineId} not found.");

        var relations = await _relationRepository.GetByMachineIdAsync(machine.Id, ct);

        var sensorDtos = new List<SensorDto>();
        var latestReadings = new List<SensorReadingDto>();

        foreach (var sensor in machine.Sensors)
        {
            var latest = await _readingRepository.GetLatestBySensorIdAsync(sensor.Id, ct);
            var sensorDto = SensorMapper.ToDto(sensor, latest);
            sensorDtos.Add(sensorDto);

            if (latest != null)
                latestReadings.Add(SensorMapper.ReadingToDto(latest, sensor.Unit));
        }

        var machineDetail = MachineMapper.ToDetailDto(machine, sensorDtos, relations);

        var activeAlerts = (await _alertRepository.GetAllAsync(acknowledged: false, machineId: machine.Id, ct: ct))
            .Select(AlertMapper.ToDto);

        var historyDtos = machine.StateHistory.Select(h => new MachineStateHistoryDto(
            h.Id, h.MachineId, h.PreviousStatus.ToString(), h.NewStatus.ToString(), h.Reason, h.ChangedAt));

        return new DigitalTwinStateDto(machineDetail, latestReadings, activeAlerts, historyDtos);
    }
}
