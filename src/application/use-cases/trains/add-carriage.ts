import { v4 as uuidv4 } from 'uuid';
import { AddCarriageDto, TrainResultDto } from '../../dto/train-dto';
import { TrainRepository } from '../../../domain/repositories/train-repository';
import { Carriage, Seat } from '../../../domain/models/train';
import { NotFoundError } from '../../../domain/errors/domain-error';

export class AddCarriageUseCase {
  constructor(private readonly trainRepo: TrainRepository) {}

  async execute(trainId: string, dto: AddCarriageDto): Promise<TrainResultDto> {
    const train = await this.trainRepo.findById(trainId);
    if (!train) throw new NotFoundError(`Train ${trainId} not found`);

    const carriageId = uuidv4();
    const seats: Seat[] = [];
    for (let i = 1; i <= dto.seatCount; i++) {
      seats.push(new Seat(uuidv4(), i, carriageId));
    }

    const carriage = new Carriage(carriageId, dto.number, dto.type, trainId, seats);
    train.addCarriage(carriage);
    await this.trainRepo.save(train);

    return {
      id: train.id,
      number: train.number.value,
      routeId: train.routeId,
      departureTime: train.schedule.departure.toISOString(),
      arrivalTime: train.schedule.arrival.toISOString(),
      carriages: train.carriages.map((c) => ({
        id: c.id,
        number: c.number,
        type: c.type,
        seats: c.seats.map((s) => ({ id: s.id, number: s.number, carriageId: s.carriageId, isBooked: false })),
      })),
    };
  }
}
