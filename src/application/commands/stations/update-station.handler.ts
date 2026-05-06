import { UpdateStationCommand } from './update-station.command';
import { StationRepository } from '../../../domain/repositories/station-repository';
import { NotFoundError } from '../../../domain/errors/domain-error';

export class UpdateStationCommandHandler {
  constructor(private readonly stationRepo: StationRepository) {}

  async handle(command: UpdateStationCommand): Promise<void> {
    const station = await this.stationRepo.findById(command.id);
    if (!station) throw new NotFoundError(`Station ${command.id} not found`);

    station.updateDetails(command.name, command.city);
    await this.stationRepo.save(station);
  }
}
