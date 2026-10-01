using DigitalTwin.Application.DTOs;
using DigitalTwin.Application.Mappers;
using DigitalTwin.Domain.Enums;
using DigitalTwin.Domain.Interfaces;
using MediatR;

namespace DigitalTwin.Application.Features.Dashboard.Queries;

public class GetDashboardSummaryHandler : IRequestHandler<GetDashboardSummaryQuery, DashboardSummaryDto>
{
    private readonly IMachineRepository _machineRepository;
    private readonly IAlertRepository _alertRepository;

    public GetDashboardSummaryHandler(IMachineRepository machineRepository, IAlertRepository alertRepository)
    {
        _machineRepository = machineRepository;
        _alertRepository = alertRepository;
    }

    public async Task<DashboardSummaryDto> Handle(GetDashboardSummaryQuery request, CancellationToken cancellationToken)
    {
        var machines = (await _machineRepository.GetAllWithSensorsAsync(cancellationToken)).ToList();
        var allAlerts = (await _alertRepository.GetAllAsync(acknowledged: false, ct: cancellationToken)).ToList();

        var machineDtos = new List<MachineSummaryDto>();
        foreach (var machine in machines)
        {
            var machineAlerts = allAlerts.Where(a => a.MachineId == machine.Id).ToList();
            machineDtos.Add(MachineMapper.ToSummaryDto(machine, machineAlerts.Count));
        }

        return new DashboardSummaryDto(
            TotalMachines: machines.Count,
            Running: machines.Count(m => m.Status == MachineStatus.Running),
            Warning: machines.Count(m => m.Status == MachineStatus.Warning),
            Critical: machines.Count(m => m.Status == MachineStatus.Critical),
            Stopped: machines.Count(m => m.Status == MachineStatus.Stopped),
            ActiveAlerts: allAlerts.Count,
            CriticalAlerts: allAlerts.Count(a => a.Severity == Domain.Enums.AlertSeverity.Critical),
            Machines: machineDtos);
    }
}

public class GetPlantTopologyHandler : IRequestHandler<GetPlantTopologyQuery, PlantTopologyDto>
{
    private readonly IPlantRepository _plantRepository;
    private readonly IMachineRepository _machineRepository;
    private readonly IMachineRelationRepository _relationRepository;
    private readonly IAlertRepository _alertRepository;

    public GetPlantTopologyHandler(
        IPlantRepository plantRepository,
        IMachineRepository machineRepository,
        IMachineRelationRepository relationRepository,
        IAlertRepository alertRepository)
    {
        _plantRepository = plantRepository;
        _machineRepository = machineRepository;
        _relationRepository = relationRepository;
        _alertRepository = alertRepository;
    }

    public async Task<PlantTopologyDto> Handle(GetPlantTopologyQuery request, CancellationToken cancellationToken)
    {
        var plants = await _plantRepository.GetAllAsync(cancellationToken);
        var plant = plants.FirstOrDefault() ?? throw new InvalidOperationException("No plant configured.");

        var machines = (await _machineRepository.GetAllAsync(cancellationToken)).ToList();
        var relations = (await _relationRepository.GetAllAsync(cancellationToken)).ToList();
        var alerts = (await _alertRepository.GetAllAsync(acknowledged: false, ct: cancellationToken)).ToList();

        var lineLookup = plant.ProductionLines.ToDictionary(l => l.Id, l => l.Name);
        var nodes = machines.Select(m => new MachineNodeDto(
            m.Id, m.Code, m.Name, m.Type.ToString(), m.Status.ToString(),
            alerts.Count(a => a.MachineId == m.Id),
            m.ProductionLineId,
            lineLookup.GetValueOrDefault(m.ProductionLineId)));

        var edges = relations.Select(r =>
        {
            var src = machines.First(m => m.Id == r.SourceMachineId);
            var tgt = machines.First(m => m.Id == r.TargetMachineId);
            return new MachineRelationDto(r.Id,
                r.SourceMachineId, src.Code, src.Name,
                r.TargetMachineId, tgt.Code, tgt.Name,
                r.RelationType.ToString(), r.Description);
        });

        return new PlantTopologyDto(plant.Id, plant.Name, nodes, edges);
    }
}
