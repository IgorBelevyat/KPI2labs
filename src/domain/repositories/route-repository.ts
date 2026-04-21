import { Route } from '../models/route';

export interface RouteRepository {
  save(route: Route): Promise<void>;
  findById(id: string): Promise<Route | null>;
  findAll(): Promise<Route[]>;
  delete(id: string): Promise<void>;
  isUsedByTrains(id: string): Promise<boolean>;
}
