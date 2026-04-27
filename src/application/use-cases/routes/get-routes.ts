import { RouteResultDto } from '../../dto/route-dto';
import { RouteRepository } from '../../../domain/repositories/route-repository';

export class GetRoutesUseCase {
  constructor(private readonly routeRepo: RouteRepository) {}

  async execute(): Promise<RouteResultDto[]> {
    const routes = await this.routeRepo.findAll();
    return routes.map((r) => ({
      id: r.id,
      stops: r.stops.map((s) => ({ stationId: s.stationId, orderIndex: s.orderIndex })),
    }));
  }
}
