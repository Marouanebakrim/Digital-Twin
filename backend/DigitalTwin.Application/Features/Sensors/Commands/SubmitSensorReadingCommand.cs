using DigitalTwin.Application.DTOs;
using MediatR;

namespace DigitalTwin.Application.Features.Sensors.Commands;

/// <summary>
/// Submit a new sensor reading. Triggers the full pipeline:
/// validate → persist → anomaly detection → alert → state update → SignalR
/// </summary>
public record SubmitSensorReadingCommand(Guid SensorId, double Value, DateTime? Timestamp) : IRequest<SensorReadingDto>;
