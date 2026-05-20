export interface CreateTrainDto {
  number: string;
  routeId: string;
  departureTime: string;
  arrivalTime: string;
}

export interface UpdateTrainDto {
  number: string;
  routeId: string;
  departureTime: string;
  arrivalTime: string;
}

export interface AddCarriageDto {
  number: number;
  type: 'platskart' | 'coupe' | 'sv';
  seatCount: number;
}

export interface SeatResultDto {
  id: string;
  number: number;
  carriageId: string;
  isBooked: boolean;
}

export interface CarriageResultDto {
  id: string;
  number: number;
  type: string;
  seats: SeatResultDto[];
}

export interface TrainResultDto {
  id: string;
  number: string;
  routeId: string;
  departureTime: string;
  arrivalTime: string;
  carriages: CarriageResultDto[];
}
