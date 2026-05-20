import { GetAvailableSeatsQuery } from './get-available-seats.query';
import { CarriageReadModel } from './train.read-model';
import { TrainReadRepository } from '../../interfaces/train-read-repository';

export class GetAvailableSeatsQueryHandler {
  constructor(private readonly readRepo: TrainReadRepository) {}

  async handle(query: GetAvailableSeatsQuery): Promise<CarriageReadModel[]> {
    const travelDate = query.travelDate ? new Date(query.travelDate) : undefined;
    return this.readRepo.findSeatsAvailability(query.trainId, travelDate);
  }
}
