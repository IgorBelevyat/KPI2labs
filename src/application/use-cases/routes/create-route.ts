import { CreateRouteDto, RouteResultDto } from '../../dto/route-dto';
import { RouteFactory } from '../../../domain/factories/route-factory';
import { RouteRepository } from '../../../domain/repositories/route-repository';

export class CreateRouteUseCase {
  constructor(
    private readonly routeFactory: RouteFactory,
    private readonly routeRepo: RouteRepository
  ) {}

  async execute(dto: CreateRouteDto): Promise<RouteResultDto> {
    const route = await this.routeFactory.create(dto.stops);
    await this.routeRepo.save(route);
    return {
      id: route.id,
      stops: route.stops.map((s) => ({ stationId: s.stationId, orderIndex: s.orderIndex })),
    };
  }
}
