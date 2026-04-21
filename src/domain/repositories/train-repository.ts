import { Train } from '../models/train';

export interface TrainRepository {
  save(train: Train): Promise<void>;
  findById(id: string): Promise<Train | null>;
  findByNumber(number: string): Promise<Train | null>;
  findByRouteAndDate(originStationId: string, destinationStationId: string, date: Date): Promise<Train[]>;
  findAll(): Promise<Train[]>;
  existsByNumber(number: string): Promise<boolean>;
  delete(id: string): Promise<void>;
  hasActiveBookings(id: string): Promise<boolean>;
}
