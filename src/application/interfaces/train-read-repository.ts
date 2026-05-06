import { TrainReadModel } from '../queries/trains/train.read-model';
import { CarriageReadModel } from '../queries/trains/train.read-model';

export interface TrainReadRepository {
  findAll(): Promise<TrainReadModel[]>;
  searchByRouteAndDate(originStationId: string, destinationStationId: string, date: Date): Promise<TrainReadModel[]>;
  findSeatsAvailability(trainId: string, travelDate?: Date): Promise<CarriageReadModel[]>;
}
