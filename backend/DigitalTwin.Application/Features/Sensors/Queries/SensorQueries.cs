using DigitalTwin.Application.DTOs;
using MediatR;

namespace DigitalTwin.Application.Features.Sensors.Queries;

public record GetSensorReadingsQuery(Guid SensorId, DateTime From, DateTime To, int PageSize = 500)
    : IRequest<IEnumerable<SensorReadingDto>>;

public record GetLatestSensorReadingQuery(Guid SensorId) : IRequest<SensorReadingDto?>;
