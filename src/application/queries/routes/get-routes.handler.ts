import { RouteReadModel } from './route.read-model';
import { RouteReadRepository } from '../../interfaces/route-read-repository';

export class GetRoutesQueryHandler {
  constructor(private readonly readRepo: RouteReadRepository) {}

  async handle(): Promise<RouteReadModel[]> {
    return this.readRepo.findAll();
  }
}
