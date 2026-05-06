import { StationReadModel } from './station.read-model';
import { StationReadRepository } from '../../interfaces/station-read-repository';

export class GetStationsQueryHandler {
  constructor(private readonly readRepo: StationReadRepository) {}

  async handle(): Promise<StationReadModel[]> {
    return this.readRepo.findAll();
  }
}
