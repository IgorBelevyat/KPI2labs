import { SearchTrainsQuery } from './search-trains.query';
import { TrainReadModel } from './train.read-model';
import { TrainReadRepository } from '../../interfaces/train-read-repository';

export class SearchTrainsQueryHandler {
  constructor(private readonly readRepo: TrainReadRepository) {}

  async handle(query: SearchTrainsQuery): Promise<TrainReadModel[]> {
    return this.readRepo.searchByRouteAndDate(
      query.originStationId,
      query.destinationStationId,
      new Date(query.date)
    );
  }
}
