import { StationRepository } from '../../../domain/repositories/station-repository';
import { NotFoundError, ConflictError } from '../../../domain/errors/domain-error';

export class DeleteStationUseCase {
  constructor(private readonly stationRepo: StationRepository) {}

  async execute(id: string): Promise<void> {
    const station = await this.stationRepo.findById(id);
    if (!station) throw new NotFoundError(`Station ${id} not found`);

    const isUsed = await this.stationRepo.isUsedInRoutes(id);
    if (isUsed) throw new ConflictError('Cannot delete station that is used in routes');

    await this.stationRepo.delete(id);
  }
}
