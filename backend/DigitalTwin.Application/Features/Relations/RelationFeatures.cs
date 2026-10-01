using DigitalTwin.Application.DTOs;
using DigitalTwin.Domain.Entities;
using DigitalTwin.Domain.Interfaces;
using MediatR;

namespace DigitalTwin.Application.Features.Relations;

public record GetMachineRelationsQuery(Guid MachineId) : IRequest<IEnumerable<MachineRelationDto>>;
public record CreateMachineRelationCommand(CreateMachineRelationDto Dto) : IRequest<MachineRelationDto>;

public class GetMachineRelationsHandler : IRequestHandler<GetMachineRelationsQuery, IEnumerable<MachineRelationDto>>
{
    private readonly IMachineRelationRepository _relationRepository;

    public GetMachineRelationsHandler(IMachineRelationRepository relationRepository) => _relationRepository = relationRepository;

    public async Task<IEnumerable<MachineRelationDto>> Handle(GetMachineRelationsQuery request, CancellationToken ct)
    {
        var relations = await _relationRepository.GetByMachineIdAsync(request.MachineId, ct);
        return relations.Select(r => new MachineRelationDto(
            r.Id,
            r.SourceMachineId, r.SourceMachine?.Code ?? string.Empty, r.SourceMachine?.Name ?? string.Empty,
            r.TargetMachineId, r.TargetMachine?.Code ?? string.Empty, r.TargetMachine?.Name ?? string.Empty,
            r.RelationType.ToString(), r.Description));
    }
}

public class CreateMachineRelationHandler : IRequestHandler<CreateMachineRelationCommand, MachineRelationDto>
{
    private readonly IMachineRelationRepository _relationRepository;
    private readonly IMachineRepository _machineRepository;

    public CreateMachineRelationHandler(
        IMachineRelationRepository relationRepository,
        IMachineRepository machineRepository)
    {
        _relationRepository = relationRepository;
        _machineRepository = machineRepository;
    }

    public async Task<MachineRelationDto> Handle(CreateMachineRelationCommand request, CancellationToken ct)
    {
        var src = await _machineRepository.GetByIdAsync(request.Dto.SourceMachineId, ct)
            ?? throw new KeyNotFoundException($"Source Machine {request.Dto.SourceMachineId} not found.");

        var tgt = await _machineRepository.GetByIdAsync(request.Dto.TargetMachineId, ct)
            ?? throw new KeyNotFoundException($"Target Machine {request.Dto.TargetMachineId} not found.");

        var relation = new MachineRelation(
            request.Dto.SourceMachineId,
            request.Dto.TargetMachineId,
            request.Dto.RelationType,
            request.Dto.Description);

        await _relationRepository.AddAsync(relation, ct);
        await _relationRepository.SaveChangesAsync(ct);

        return new MachineRelationDto(
            relation.Id,
            src.Id, src.Code, src.Name,
            tgt.Id, tgt.Code, tgt.Name,
            relation.RelationType.ToString(), relation.Description);
    }
}
