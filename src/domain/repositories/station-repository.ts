import { Station } from '../models/station';

export interface StationRepository {
  save(station: Station): Promise<void>;
  findById(id: string): Promise<Station | null>;
  findByName(name: string): Promise<Station | null>;
  findAll(): Promise<Station[]>;
  existsByName(name: string): Promise<boolean>;
  delete(id: string): Promise<void>;
  isUsedInRoutes(id: string): Promise<boolean>;
}
