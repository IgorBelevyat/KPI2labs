import { v4 as uuidv4 } from 'uuid';
import { Route, RouteStop } from '../models/route';
import { StationRepository } from '../repositories/station-repository';
import { NotFoundError, DomainError } from '../errors/domain-error';

export interface CreateRouteStopInput {
  stationId: string;
  orderIndex: number;
}

export class RouteFactory {
  constructor(private readonly stationRepo: StationRepository) { }

  async create(stops: CreateRouteStopInput[]): Promise<Route> {
    if (stops.length < 2) {
      throw new DomainError('Route must contain at least 2 stations');
    }

    // all stations must exist (needs DB)
    for (const stop of stops) {
      const station = await this.stationRepo.findById(stop.stationId);
      if (!station) {
        throw new NotFoundError(`Station ${stop.stationId} not found`);
      }
    }

    const routeStops = stops.map(
      (s) => new RouteStop(s.stationId, s.orderIndex)
    );

    return new Route(uuidv4(), routeStops);
  }
}
