export interface BookingReadModel {
  id: string;
  userId: string;
  trainId: string;
  seatId: string;
  travelDate: string;
  status: string;
  createdAt: string;
  train?: {
    number: string;
    departureTime: string;
    arrivalTime: string;
  };
  seat?: {
    number: number;
  };
}
