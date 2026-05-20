import { v4 as uuidv4 } from 'uuid';
import { AddCarriageCommand } from './add-carriage.command';
import { TrainRepository } from '../../../domain/repositories/train-repository';
import { Carriage, Seat } from '../../../domain/models/train';
import { NotFoundError } from '../../../../../shared/errors/domain-error';

export class AddCarriageCommandHandler {
  constructor(private readonly trainRepo: TrainRepository) {}

  async handle(command: AddCarriageCommand): Promise<{ id: string }> {
    const train = await this.trainRepo.findById(command.trainId);
    if (!train) throw new NotFoundError(`Train ${command.trainId} not found`);

    const carriageId = uuidv4();
    const seats: Seat[] = [];
    for (let i = 1; i <= command.seatCount; i++) {
      seats.push(new Seat(uuidv4(), i, carriageId));
    }

    const carriage = new Carriage(carriageId, command.number, command.type, command.trainId, seats);
    train.addCarriage(carriage);
    await this.trainRepo.save(train);

    return { id: carriageId };
  }
}
