import { v4 as uuidv4 } from 'uuid';
import { Station } from '../models/station';
import { StationRepository } from '../repositories/station-repository';
import { ConflictError } from '../errors/domain-error';

export class StationFactory {
  constructor(private readonly stationRepo: StationRepository) { }

  async create(name: string, city: string): Promise<Station> {
    // station name uniqueness (needs DB)
    const exists = await this.stationRepo.existsByName(name.trim());
    if (exists) {
      throw new ConflictError(`Station with name "${name.trim()}" already exists`);
    }

    return new Station(uuidv4(), name, city);
  }
}
