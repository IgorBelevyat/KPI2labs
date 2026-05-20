export interface TrainInfo {
  id: string;
  routeId: string;
}

export interface SeatInfo {
  id: string;
  carriageId: string;
}

export interface CatalogService {
  getTrainInfo(trainId: string): Promise<TrainInfo | null>;
  verifySeatExists(trainId: string, seatId: string): Promise<boolean>;
}
