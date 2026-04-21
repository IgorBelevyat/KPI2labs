import { Route } from '../../../src/domain/models/route';
import { RouteRepository } from '../../../src/domain/repositories/route-repository';

export class InMemoryRouteRepo implements RouteRepository {
  private routes: Route[] = [];

  async save(r: Route): Promise<void> { this.routes.push(r); }
  async findById(id: string): Promise<Route | null> { return this.routes.find(r => r.id === id) ?? null; }
  async findAll(): Promise<Route[]> { return [...this.routes]; }
  async delete(id: string): Promise<void> { this.routes = this.routes.filter(r => r.id !== id); }
  async isUsedByTrains(): Promise<boolean> { return false; }

  seed(routes: Route[]): void { this.routes = [...routes]; }
}
