using DigitalTwin.Application.DTOs;
using MediatR;

namespace DigitalTwin.Application.Features.Machines.Queries;

public record GetMachinesQuery() : IRequest<IEnumerable<MachineSummaryDto>>;
public record GetMachineByIdQuery(Guid Id) : IRequest<MachineDetailDto>;
