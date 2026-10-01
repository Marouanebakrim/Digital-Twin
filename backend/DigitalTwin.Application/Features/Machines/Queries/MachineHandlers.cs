using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Mappers;
using DigitalTwin.Domain.Interfaces;
using MediatR;

namespace DigitalTwin.Application.Features.Machines.Queries;

public class GetMachinesHandler : IRequestHandler<GetMachinesQuery, IEnumerable<MachineSummaryDto>>
{
    private readonly IMachineRepository _machineRepository;
    private readonly IAlertRepository _alertRepository;

    public GetMachinesHandler(IMachineRepository machineRepository, IAlertRepository alertRepository)
    {
        _machineRepository = machineRepository;
        _alertRepository = alertRepository;
    }

    public async Task<IEnumerable<MachineSummaryDto>> Handle(GetMachinesQuery request, CancellationToken cancellationToken)
    {
        var machines = await _machineRepository.GetAllWithSensorsAsync(cancellationToken);
        var result = new List<MachineSummaryDto>();

        foreach (var machine in machines)
        {
            var alerts = await _alertRepository.GetAllAsync(acknowledged: false, machineId: machine.Id, ct: cancellationToken);
            result.Add(MachineMapper.ToSummaryDto(machine, alerts.Count));
        }

        return result;
    }
}

public class GetMachineByIdHandler : IRequestHandler<GetMachineByIdQuery, MachineDetailDto>
{
    private readonly IMachineRepository _machineRepository;
    private readonly IMachineRelationRepository _relationRepository;
    private readonly ISensorReadingRepository _readingRepository;

    public GetMachineByIdHandler(
        IMachineRepository machineRepository,
        IMachineRelationRepository relationRepository,
        ISensorReadingRepository readingRepository)
    {
        _machineRepository = machineRepository;
        _relationRepository = relationRepository;
        _readingRepository = readingRepository;
    }

    public async Task<MachineDetailDto> Handle(GetMachineByIdQuery request, CancellationToken cancellationToken)
    {
        var machine = await _machineRepository.GetByIdWithSensorsAsync(request.Id, cancellationToken)
            ?? throw new KeyNotFoundException($"Machine {request.Id} not found.");

        var relations = await _relationRepository.GetByMachineIdAsync(machine.Id, cancellationToken);

        var sensorDtos = new List<SensorDto>();
        foreach (var sensor in machine.Sensors)
        {
            var latest = await _readingRepository.GetLatestBySensorIdAsync(sensor.Id, cancellationToken);
            sensorDtos.Add(SensorMapper.ToDto(sensor, latest));
        }

        return MachineMapper.ToDetailDto(machine, sensorDtos, relations);
    }
}
