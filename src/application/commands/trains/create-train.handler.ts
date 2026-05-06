import { CreateTrainCommand } from './create-train.command';
import { TrainFactory } from '../../../domain/factories/train-factory';
import { TrainRepository } from '../../../domain/repositories/train-repository';

export class CreateTrainCommandHandler {
  constructor(
    private readonly trainFactory: TrainFactory,
    private readonly trainRepo: TrainRepository
  ) {}

  async handle(command: CreateTrainCommand): Promise<{ id: string }> {
    const train = await this.trainFactory.create(
      command.number,
      command.routeId,
      new Date(command.departureTime),
      new Date(command.arrivalTime)
    );
    await this.trainRepo.save(train);
    return { id: train.id };
  }
}
