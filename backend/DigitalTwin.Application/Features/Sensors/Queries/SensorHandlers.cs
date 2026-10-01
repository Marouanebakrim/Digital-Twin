using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Mappers;
using DigitalTwin.Domain.Interfaces;
using MediatR;

namespace DigitalTwin.Application.Features.Sensors.Queries;

public class GetSensorReadingsHandler : IRequestHandler<GetSensorReadingsQuery, IEnumerable<SensorReadingDto>>
{
    private readonly ISensorRepository _sensorRepository;
    private readonly ISensorReadingRepository _readingRepository;

    public GetSensorReadingsHandler(ISensorRepository sensorRepository, ISensorReadingRepository readingRepository)
    {
        _sensorRepository = sensorRepository;
        _readingRepository = readingRepository;
    }

    public async Task<IEnumerable<SensorReadingDto>> Handle(GetSensorReadingsQuery request, CancellationToken cancellationToken)
    {
        var sensor = await _sensorRepository.GetByIdAsync(request.SensorId, cancellationToken)
            ?? throw new KeyNotFoundException($"Sensor {request.SensorId} not found.");

        var readings = await _readingRepository.GetBySensorIdAsync(
            request.SensorId, request.From, request.To, request.PageSize, cancellationToken);

        return readings.Select(r => SensorMapper.ReadingToDto(r, sensor.Unit));
    }
}

public class GetLatestSensorReadingHandler : IRequestHandler<GetLatestSensorReadingQuery, SensorReadingDto?>
{
    private readonly ISensorRepository _sensorRepository;
    private readonly ISensorReadingRepository _readingRepository;

    public GetLatestSensorReadingHandler(ISensorRepository sensorRepository, ISensorReadingRepository readingRepository)
    {
        _sensorRepository = sensorRepository;
        _readingRepository = readingRepository;
    }

    public async Task<SensorReadingDto?> Handle(GetLatestSensorReadingQuery request, CancellationToken cancellationToken)
    {
        var sensor = await _sensorRepository.GetByIdAsync(request.SensorId, cancellationToken)
            ?? throw new KeyNotFoundException($"Sensor {request.SensorId} not found.");

        var reading = await _readingRepository.GetLatestBySensorIdAsync(request.SensorId, cancellationToken);
        return reading is null ? null : SensorMapper.ReadingToDto(reading, sensor.Unit);
    }
}
