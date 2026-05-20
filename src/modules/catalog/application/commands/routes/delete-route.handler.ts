import { DeleteRouteCommand } from './delete-route.command';
import { RouteRepository } from '../../../domain/repositories/route-repository';
import { NotFoundError, ConflictError } from '../../../../../shared/errors/domain-error';

export class DeleteRouteCommandHandler {
  constructor(private readonly routeRepo: RouteRepository) {}

  async handle(command: DeleteRouteCommand): Promise<void> {
    const route = await this.routeRepo.findById(command.id);
    if (!route) throw new NotFoundError(`Route ${command.id} not found`);

    const isUsed = await this.routeRepo.isUsedByTrains(command.id);
    if (isUsed) throw new ConflictError('Cannot delete route that is assigned to trains');

    await this.routeRepo.delete(command.id);
  }
}
