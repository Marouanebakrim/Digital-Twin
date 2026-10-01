using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Mappers;
using DigitalTwin.Domain.Entities;
using DigitalTwin.Domain.Interfaces;
using MediatR;

namespace DigitalTwin.Application.Features.Sensors;

public record GetSensorsByMachineIdQuery(Guid MachineId) : IRequest<IEnumerable<SensorDto>>;
public record GetSensorByIdQuery(Guid Id) : IRequest<SensorDto>;
public record CreateSensorCommand(Guid MachineId, CreateSensorDto Dto) : IRequest<SensorDto>;

public class GetSensorsByMachineIdHandler : IRequestHandler<GetSensorsByMachineIdQuery, IEnumerable<SensorDto>>
{
    private readonly ISensorRepository _sensorRepository;
    private readonly ISensorReadingRepository _readingRepository;

    public GetSensorsByMachineIdHandler(ISensorRepository sensorRepository, ISensorReadingRepository readingRepository)
    {
        _sensorRepository = sensorRepository;
        _readingRepository = readingRepository;
    }

    public async Task<IEnumerable<SensorDto>> Handle(GetSensorsByMachineIdQuery request, CancellationToken ct)
    {
        var sensors = await _sensorRepository.GetByMachineIdAsync(request.MachineId, ct);
        var result = new List<SensorDto>();

        foreach (var s in sensors)
        {
            var latest = await _readingRepository.GetLatestBySensorIdAsync(s.Id, ct);
            result.Add(SensorMapper.ToDto(s, latest));
        }

        return result;
    }
}

public class GetSensorByIdHandler : IRequestHandler<GetSensorByIdQuery, SensorDto>
{
    private readonly ISensorRepository _sensorRepository;
    private readonly ISensorReadingRepository _readingRepository;

    public GetSensorByIdHandler(ISensorRepository sensorRepository, ISensorReadingRepository readingRepository)
    {
        _sensorRepository = sensorRepository;
        _readingRepository = readingRepository;
    }

    public async Task<SensorDto> Handle(GetSensorByIdQuery request, CancellationToken ct)
    {
        var sensor = await _sensorRepository.GetByIdAsync(request.Id, ct)
            ?? throw new KeyNotFoundException($"Sensor {request.Id} not found.");

        var latest = await _readingRepository.GetLatestBySensorIdAsync(sensor.Id, ct);
        return SensorMapper.ToDto(sensor, latest);
    }
}

public class CreateSensorHandler : IRequestHandler<CreateSensorCommand, SensorDto>
{
    private readonly ISensorRepository _sensorRepository;
    private readonly IMachineRepository _machineRepository;

    public CreateSensorHandler(ISensorRepository sensorRepository, IMachineRepository machineRepository)
    {
        _sensorRepository = sensorRepository;
        _machineRepository = machineRepository;
    }

    public async Task<SensorDto> Handle(CreateSensorCommand request, CancellationToken ct)
    {
        var machine = await _machineRepository.GetByIdAsync(request.MachineId, ct)
            ?? throw new KeyNotFoundException($"Machine {request.MachineId} not found.");

        var sensor = new Sensor(
            request.MachineId,
            request.Dto.Code,
            request.Dto.Name,
            request.Dto.SensorType,
            request.Dto.Unit,
            request.Dto.MinValue,
            request.Dto.MaxValue);

        await _sensorRepository.AddAsync(sensor, ct);
        await _sensorRepository.SaveChangesAsync(ct);

        return SensorMapper.ToDto(sensor, null);
    }
}
