import { DeleteStationCommand } from './delete-station.command';
import { StationRepository } from '../../../domain/repositories/station-repository';
import { NotFoundError, ConflictError } from '../../../../../shared/errors/domain-error';

export class DeleteStationCommandHandler {
  constructor(private readonly stationRepo: StationRepository) {}

  async handle(command: DeleteStationCommand): Promise<void> {
    const station = await this.stationRepo.findById(command.id);
    if (!station) throw new NotFoundError(`Station ${command.id} not found`);

    const isUsed = await this.stationRepo.isUsedInRoutes(command.id);
    if (isUsed) throw new ConflictError('Cannot delete station that is used in routes');

    await this.stationRepo.delete(command.id);
  }
}
