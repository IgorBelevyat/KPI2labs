import { UpdateRouteDto, RouteResultDto } from '../../dto/route-dto';
import { RouteRepository } from '../../../domain/repositories/route-repository';
import { StationRepository } from '../../../domain/repositories/station-repository';
import { RouteStop } from '../../../domain/models/route';
import { NotFoundError } from '../../../domain/errors/domain-error';

export class UpdateRouteUseCase {
  constructor(
    private readonly routeRepo: RouteRepository,
    private readonly stationRepo: StationRepository
  ) {}

  async execute(id: string, dto: UpdateRouteDto): Promise<RouteResultDto> {
    const route = await this.routeRepo.findById(id);
    if (!route) throw new NotFoundError(`Route ${id} not found`);

    for (const stop of dto.stops) {
      const station = await this.stationRepo.findById(stop.stationId);
      if (!station) throw new NotFoundError(`Station ${stop.stationId} not found`);
    }

    const newStops = dto.stops.map((s) => new RouteStop(s.stationId, s.orderIndex));
    route.updateStops(newStops);
    await this.routeRepo.save(route);

    return {
      id: route.id,
      stops: route.stops.map((s) => ({ stationId: s.stationId, orderIndex: s.orderIndex })),
    };
  }
}
