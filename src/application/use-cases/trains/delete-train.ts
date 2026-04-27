import { TrainRepository } from '../../../domain/repositories/train-repository';
import { NotFoundError, ConflictError } from '../../../domain/errors/domain-error';

export class DeleteTrainUseCase {
  constructor(private readonly trainRepo: TrainRepository) {}

  async execute(id: string): Promise<void> {
    const train = await this.trainRepo.findById(id);
    if (!train) throw new NotFoundError(`Train ${id} not found`);

    const hasBookings = await this.trainRepo.hasActiveBookings(id);
    if (hasBookings) throw new ConflictError('Cannot delete train with active bookings');

    await this.trainRepo.delete(id);
  }
}
