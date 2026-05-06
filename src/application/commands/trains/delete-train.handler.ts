import { DeleteTrainCommand } from './delete-train.command';
import { TrainRepository } from '../../../domain/repositories/train-repository';
import { NotFoundError, ConflictError } from '../../../domain/errors/domain-error';

export class DeleteTrainCommandHandler {
  constructor(private readonly trainRepo: TrainRepository) {}

  async handle(command: DeleteTrainCommand): Promise<void> {
    const train = await this.trainRepo.findById(command.id);
    if (!train) throw new NotFoundError(`Train ${command.id} not found`);

    const hasBookings = await this.trainRepo.hasActiveBookings(command.id);
    if (hasBookings) throw new ConflictError('Cannot delete train with active bookings');

    await this.trainRepo.delete(command.id);
  }
}
