import { RouteReadModel } from '../queries/routes/route.read-model';

export interface RouteReadRepository {
  findAll(): Promise<RouteReadModel[]>;
}
