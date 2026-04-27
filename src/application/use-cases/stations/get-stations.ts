import { StationResultDto } from '../../dto/station-dto';
import { StationRepository } from '../../../domain/repositories/station-repository';

export class GetStationsUseCase {
  constructor(private readonly stationRepo: StationRepository) {}

  async execute(): Promise<StationResultDto[]> {
    const stations = await this.stationRepo.findAll();
    return stations.map((s) => ({ id: s.id, name: s.name, city: s.city }));
  }
}
