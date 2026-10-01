using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Mappers;
using DigitalTwin.Domain.Interfaces;
using MediatR;

namespace DigitalTwin.Application.Features.Plants;

public record GetPlantsQuery() : IRequest<IEnumerable<PlantDto>>;
public record GetPlantByIdQuery(Guid Id) : IRequest<PlantDto>;

public record GetProductionLinesQuery() : IRequest<IEnumerable<ProductionLineDto>>;
public record GetProductionLineByIdQuery(Guid Id) : IRequest<ProductionLineDto>;

public class GetPlantsHandler : IRequestHandler<GetPlantsQuery, IEnumerable<PlantDto>>
{
    private readonly IPlantRepository _plantRepository;

    public GetPlantsHandler(IPlantRepository plantRepository) => _plantRepository = plantRepository;

    public async Task<IEnumerable<PlantDto>> Handle(GetPlantsQuery request, CancellationToken ct)
    {
        var plants = await _plantRepository.GetAllAsync(ct);
        var result = new List<PlantDto>();

        foreach (var p in plants)
        {
            var lineDtos = p.ProductionLines.Select(l =>
                ProductionLineMapper.ToDto(l, l.Machines.Select(m => MachineMapper.ToSummaryDto(m, 0))));

            result.Add(PlantMapper.ToDto(p, lineDtos));
        }

        return result;
    }
}

public class GetPlantByIdHandler : IRequestHandler<GetPlantByIdQuery, PlantDto>
{
    private readonly IPlantRepository _plantRepository;

    public GetPlantByIdHandler(IPlantRepository plantRepository) => _plantRepository = plantRepository;

    public async Task<PlantDto> Handle(GetPlantByIdQuery request, CancellationToken ct)
    {
        var plant = await _plantRepository.GetByIdAsync(request.Id, ct)
            ?? throw new KeyNotFoundException($"Plant {request.Id} not found.");

        var lineDtos = plant.ProductionLines.Select(l =>
            ProductionLineMapper.ToDto(l, l.Machines.Select(m => MachineMapper.ToSummaryDto(m, 0))));

        return PlantMapper.ToDto(plant, lineDtos);
    }
}

public class GetProductionLinesHandler : IRequestHandler<GetProductionLinesQuery, IEnumerable<ProductionLineDto>>
{
    private readonly IProductionLineRepository _lineRepository;

    public GetProductionLinesHandler(IProductionLineRepository lineRepository) => _lineRepository = lineRepository;

    public async Task<IEnumerable<ProductionLineDto>> Handle(GetProductionLinesQuery request, CancellationToken ct)
    {
        var lines = await _lineRepository.GetByPlantIdAsync(Guid.Empty, ct); // get all
        return lines.Select(l => ProductionLineMapper.ToDto(l, l.Machines.Select(m => MachineMapper.ToSummaryDto(m, 0))));
    }
}

public class GetProductionLineByIdHandler : IRequestHandler<GetProductionLineByIdQuery, ProductionLineDto>
{
    private readonly IProductionLineRepository _lineRepository;

    public GetProductionLineByIdHandler(IProductionLineRepository lineRepository) => _lineRepository = lineRepository;

    public async Task<ProductionLineDto> Handle(GetProductionLineByIdQuery request, CancellationToken ct)
    {
        var line = await _lineRepository.GetByIdAsync(request.Id, ct)
            ?? throw new KeyNotFoundException($"ProductionLine {request.Id} not found.");

        return ProductionLineMapper.ToDto(line, line.Machines.Select(m => MachineMapper.ToSummaryDto(m, 0)));
    }
}
