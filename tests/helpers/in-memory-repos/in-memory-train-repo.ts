import { Train } from '../../../src/domain/models/train';
import { TrainRepository } from '../../../src/domain/repositories/train-repository';

export class InMemoryTrainRepo implements TrainRepository {
  private trains: Train[] = [];

  async save(t: Train): Promise<void> { this.trains.push(t); }
  async findById(id: string): Promise<Train | null> { return this.trains.find(t => t.id === id) ?? null; }
  async findByNumber(num: string): Promise<Train | null> { return this.trains.find(t => t.number.value === num) ?? null; }
  async findByRouteAndDate(): Promise<Train[]> { return []; }
  async findAll(): Promise<Train[]> { return [...this.trains]; }
  async existsByNumber(num: string): Promise<boolean> { return this.trains.some(t => t.number.value === num); }
  async delete(id: string): Promise<void> { this.trains = this.trains.filter(t => t.id !== id); }
  async hasActiveBookings(): Promise<boolean> { return false; }

  seed(trains: Train[]): void { this.trains = [...trains]; }
}
