import { UpdateStationDto, StationResultDto } from '../../dto/station-dto';
import { StationRepository } from '../../../domain/repositories/station-repository';
import { NotFoundError } from '../../../domain/errors/domain-error';

export class UpdateStationUseCase {
  constructor(private readonly stationRepo: StationRepository) {}

  async execute(id: string, dto: UpdateStationDto): Promise<StationResultDto> {
    const station = await this.stationRepo.findById(id);
    if (!station) throw new NotFoundError(`Station ${id} not found`);

    station.updateDetails(dto.name, dto.city);
    await this.stationRepo.save(station);
    return { id: station.id, name: station.name, city: station.city };
  }
}
