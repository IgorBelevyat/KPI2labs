import { UpdateTrainCommand } from './update-train.command';
import { TrainRepository } from '../../../domain/repositories/train-repository';
import { RouteRepository } from '../../../domain/repositories/route-repository';
import { TrainNumber } from '../../../domain/value-objects/train-number';
import { TimeRange } from '../../../domain/value-objects/time-range';
import { NotFoundError } from '../../../../../shared/errors/domain-error';

export class UpdateTrainCommandHandler {
  constructor(
    private readonly trainRepo: TrainRepository,
    private readonly routeRepo: RouteRepository
  ) {}

  async handle(command: UpdateTrainCommand): Promise<void> {
    const train = await this.trainRepo.findById(command.id);
    if (!train) throw new NotFoundError(`Train ${command.id} not found`);

    const route = await this.routeRepo.findById(command.routeId);
    if (!route) throw new NotFoundError(`Route ${command.routeId} not found`);

    train.updateDetails(
      new TrainNumber(command.number),
      command.routeId,
      new TimeRange(new Date(command.departureTime), new Date(command.arrivalTime))
    );
    await this.trainRepo.save(train);
  }
}
