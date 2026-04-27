import { RouteRepository } from '../../../domain/repositories/route-repository';
import { NotFoundError, ConflictError } from '../../../domain/errors/domain-error';

export class DeleteRouteUseCase {
  constructor(private readonly routeRepo: RouteRepository) {}

  async execute(id: string): Promise<void> {
    const route = await this.routeRepo.findById(id);
    if (!route) throw new NotFoundError(`Route ${id} not found`);

    const isUsed = await this.routeRepo.isUsedByTrains(id);
    if (isUsed) throw new ConflictError('Cannot delete route that is assigned to trains');

    await this.routeRepo.delete(id);
  }
}
