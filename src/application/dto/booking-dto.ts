export interface CreateBookingDto {
  trainId: string;
  seatId: string;
  travelDate: string;
}

export interface BookingResultDto {
  id: string;
  userId: string;
  trainId: string;
  seatId: string;
  travelDate: string;
  status: string;
  createdAt: string;
}
