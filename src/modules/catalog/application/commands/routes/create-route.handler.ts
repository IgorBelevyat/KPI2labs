import { CreateRouteCommand } from './create-route.command';
import { RouteFactory } from '../../../domain/factories/route-factory';
import { RouteRepository } from '../../../domain/repositories/route-repository';

export class CreateRouteCommandHandler {
  constructor(
    private readonly routeFactory: RouteFactory,
    private readonly routeRepo: RouteRepository
  ) {}

  async handle(command: CreateRouteCommand): Promise<{ id: string }> {
    const route = await this.routeFactory.create(command.stops);
    await this.routeRepo.save(route);
    return { id: route.id };
  }
}
