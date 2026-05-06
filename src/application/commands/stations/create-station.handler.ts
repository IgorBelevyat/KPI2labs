import { CreateStationCommand } from './create-station.command';
import { StationFactory } from '../../../domain/factories/station-factory';
import { StationRepository } from '../../../domain/repositories/station-repository';

export class CreateStationCommandHandler {
  constructor(
    private readonly stationFactory: StationFactory,
    private readonly stationRepo: StationRepository
  ) {}

  async handle(command: CreateStationCommand): Promise<{ id: string }> {
    const station = await this.stationFactory.create(command.name, command.city);
    await this.stationRepo.save(station);
    return { id: station.id };
  }
}
