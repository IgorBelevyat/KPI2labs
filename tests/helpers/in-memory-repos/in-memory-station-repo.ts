import { Station } from '../../../src/modules/catalog/domain/models/station';
import { StationRepository } from '../../../src/modules/catalog/domain/repositories/station-repository';

export class InMemoryStationRepo implements StationRepository {
  private stations: Station[] = [];

  async save(s: Station): Promise<void> { this.stations.push(s); }
  async findById(id: string): Promise<Station | null> { return this.stations.find(s => s.id === id) ?? null; }
  async findByName(name: string): Promise<Station | null> { return this.stations.find(s => s.name === name) ?? null; }
  async findAll(): Promise<Station[]> { return [...this.stations]; }
  async existsByName(name: string): Promise<boolean> { return this.stations.some(s => s.name === name); }
  async delete(id: string): Promise<void> { this.stations = this.stations.filter(s => s.id !== id); }
  async isUsedInRoutes(): Promise<boolean> { return false; }

  seed(stations: Station[]): void { this.stations = [...stations]; }
}
