import { UpdateRouteCommand } from './update-route.command';
import { RouteRepository } from '../../../domain/repositories/route-repository';
import { StationRepository } from '../../../domain/repositories/station-repository';
import { RouteStop } from '../../../domain/models/route';
import { NotFoundError } from '../../../domain/errors/domain-error';

export class UpdateRouteCommandHandler {
  constructor(
    private readonly routeRepo: RouteRepository,
    private readonly stationRepo: StationRepository
  ) {}

  async handle(command: UpdateRouteCommand): Promise<void> {
    const route = await this.routeRepo.findById(command.id);
    if (!route) throw new NotFoundError(`Route ${command.id} not found`);

    for (const stop of command.stops) {
      const station = await this.stationRepo.findById(stop.stationId);
      if (!station) throw new NotFoundError(`Station ${stop.stationId} not found`);
    }

    const newStops = command.stops.map((s) => new RouteStop(s.stationId, s.orderIndex));
    route.updateStops(newStops);
    await this.routeRepo.save(route);
  }
}
