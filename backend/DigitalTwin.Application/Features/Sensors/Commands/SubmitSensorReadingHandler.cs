using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Interfaces;
using MediatR;

namespace DigitalTwin.Application.Features.Sensors.Commands;

/// <summary>
/// MediatR handler that delegates the full sensor-reading pipeline to IDigitalTwinEngine.
/// Keeping the handler thin ensures the engine can also be called directly from the Simulator.
/// </summary>
public class SubmitSensorReadingHandler : IRequestHandler<SubmitSensorReadingCommand, SensorReadingDto>
{
    private readonly IDigitalTwinEngine _engine;

    public SubmitSensorReadingHandler(IDigitalTwinEngine engine)
    {
        _engine = engine;
    }

    public Task<SensorReadingDto> Handle(
        SubmitSensorReadingCommand request,
        CancellationToken cancellationToken)
        => _engine.ProcessReadingAsync(request.SensorId, request.Value, request.Timestamp, cancellationToken);
}
