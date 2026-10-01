using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Interfaces;
using MediatR;

namespace DigitalTwin.Application.Features.DigitalTwin;

public record GetCurrentMachineStateQuery(Guid MachineId) : IRequest<CurrentMachineStateDto>;

public class GetCurrentMachineStateHandler : IRequestHandler<GetCurrentMachineStateQuery, CurrentMachineStateDto>
{
    private readonly IDigitalTwinEngine _engine;

    public GetCurrentMachineStateHandler(IDigitalTwinEngine engine) => _engine = engine;

    public Task<CurrentMachineStateDto> Handle(GetCurrentMachineStateQuery request, CancellationToken ct)
        => _engine.GetCurrentStateAsync(request.MachineId, ct);
}
