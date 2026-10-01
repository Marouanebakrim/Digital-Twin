using DigitalTwin.Application.DTOs;
using MediatR;

namespace DigitalTwin.Application.Features.Dashboard.Queries;

public record GetDashboardSummaryQuery() : IRequest<DashboardSummaryDto>;
public record GetPlantTopologyQuery(Guid? PlantId = null) : IRequest<PlantTopologyDto>;
