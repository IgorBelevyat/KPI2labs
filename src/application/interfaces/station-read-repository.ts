import { StationReadModel } from '../queries/stations/station.read-model';

export interface StationReadRepository {
  findAll(): Promise<StationReadModel[]>;
}
