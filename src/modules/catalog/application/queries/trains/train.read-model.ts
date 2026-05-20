export interface SeatReadModel {
  id: string;
  number: number;
  carriageId: string;
  isBooked: boolean;
}

export interface CarriageReadModel {
  id: string;
  number: number;
  type: string;
  seats: SeatReadModel[];
}

export interface TrainReadModel {
  id: string;
  number: string;
  routeId: string;
  departureTime: string;
  arrivalTime: string;
  carriages: CarriageReadModel[];
}
