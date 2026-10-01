using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Mappers;
using DigitalTwin.Domain.Interfaces;
using MediatR;

namespace DigitalTwin.Application.Features.Sensors.Queries;

public record GetMachineReadingsQuery(Guid MachineId, DateTime From, DateTime To, int PageSize = 500)
    : IRequest<IEnumerable<SensorReadingDto>>;

public class GetMachineReadingsHandler : IRequestHandler<GetMachineReadingsQuery, IEnumerable<SensorReadingDto>>
{
    private readonly ISensorReadingRepository _readingRepository;
    private readonly ISensorRepository _sensorRepository;

    public GetMachineReadingsHandler(ISensorReadingRepository readingRepository, ISensorRepository sensorRepository)
    {
        _readingRepository = readingRepository;
        _sensorRepository = sensorRepository;
    }

    public async Task<IEnumerable<SensorReadingDto>> Handle(GetMachineReadingsQuery request, CancellationToken ct)
    {
        var readings = await _readingRepository.GetByMachineIdAsync(
            request.MachineId, request.From, request.To, request.PageSize, ct);

        var sensors = (await _sensorRepository.GetByMachineIdAsync(request.MachineId, ct))
            .ToDictionary(s => s.Id, s => s.Unit);

        return readings.Select(r => SensorMapper.ReadingToDto(r, sensors.TryGetValue(r.SensorId, out var unit) ? unit : ""));
    }
}
