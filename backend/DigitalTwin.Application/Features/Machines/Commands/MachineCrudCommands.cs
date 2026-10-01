using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Mappers;
using DigitalTwin.Domain.Entities;
using DigitalTwin.Domain.Interfaces;
using MediatR;

namespace DigitalTwin.Application.Features.Machines.Commands;

public record CreateMachineCommand(CreateMachineDto Dto) : IRequest<MachineDetailDto>;
public record UpdateMachineCommand(Guid Id, UpdateMachineDto Dto) : IRequest<MachineDetailDto>;
public record DeleteMachineCommand(Guid Id) : IRequest<bool>;

public class CreateMachineHandler : IRequestHandler<CreateMachineCommand, MachineDetailDto>
{
    private readonly IMachineRepository _machineRepository;
    private readonly IProductionLineRepository _lineRepository;

    public CreateMachineHandler(IMachineRepository machineRepository, IProductionLineRepository lineRepository)
    {
        _machineRepository = machineRepository;
        _lineRepository = lineRepository;
    }

    public async Task<MachineDetailDto> Handle(CreateMachineCommand request, CancellationToken ct)
    {
        var line = await _lineRepository.GetByIdAsync(request.Dto.ProductionLineId, ct)
            ?? throw new KeyNotFoundException($"ProductionLine {request.Dto.ProductionLineId} not found.");

        var existing = await _machineRepository.GetByCodeAsync(request.Dto.Code, ct);
        if (existing != null)
            throw new InvalidOperationException($"Machine with code '{request.Dto.Code}' already exists.");

        var machine = new Machine(
            request.Dto.ProductionLineId,
            request.Dto.Code,
            request.Dto.Name,
            request.Dto.Type,
            request.Dto.Location,
            request.Dto.Description);

        await _machineRepository.AddAsync(machine, ct);
        await _machineRepository.SaveChangesAsync(ct);

        return MachineMapper.ToDetailDto(machine, Enumerable.Empty<SensorDto>(), Enumerable.Empty<MachineRelation>());
    }
}

public class UpdateMachineHandler : IRequestHandler<UpdateMachineCommand, MachineDetailDto>
{
    private readonly IMachineRepository _machineRepository;

    public UpdateMachineHandler(IMachineRepository machineRepository) => _machineRepository = machineRepository;

    public async Task<MachineDetailDto> Handle(UpdateMachineCommand request, CancellationToken ct)
    {
        var machine = await _machineRepository.GetByIdWithSensorsAsync(request.Id, ct)
            ?? throw new KeyNotFoundException($"Machine {request.Id} not found.");

        machine.Update(request.Dto.Name, request.Dto.Location, request.Dto.Description);
        _machineRepository.Update(machine);
        await _machineRepository.SaveChangesAsync(ct);

        var sensorDtos = machine.Sensors.Select(s => SensorMapper.ToDto(s, null));
        return MachineMapper.ToDetailDto(machine, sensorDtos, Enumerable.Empty<MachineRelation>());
    }
}

public class DeleteMachineHandler : IRequestHandler<DeleteMachineCommand, bool>
{
    private readonly IMachineRepository _machineRepository;

    public DeleteMachineHandler(IMachineRepository machineRepository) => _machineRepository = machineRepository;

    public async Task<bool> Handle(DeleteMachineCommand request, CancellationToken ct)
    {
        var machine = await _machineRepository.GetByIdAsync(request.Id, ct)
            ?? throw new KeyNotFoundException($"Machine {request.Id} not found.");

        _machineRepository.Delete(machine);
        await _machineRepository.SaveChangesAsync(ct);
        return true;
    }
}
