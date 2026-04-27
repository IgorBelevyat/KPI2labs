import { CreateStationDto, StationResultDto } from '../../dto/station-dto';
import { StationFactory } from '../../../domain/factories/station-factory';
import { StationRepository } from '../../../domain/repositories/station-repository';

export class CreateStationUseCase {
  constructor(
    private readonly stationFactory: StationFactory,
    private readonly stationRepo: StationRepository
  ) {}

  async execute(dto: CreateStationDto): Promise<StationResultDto> {
    const station = await this.stationFactory.create(dto.name, dto.city);
    await this.stationRepo.save(station);
    return { id: station.id, name: station.name, city: station.city };
  }
}
