import { Booking } from '../models/booking';

export interface BookingRepository {
  save(booking: Booking): Promise<void>;
  findById(id: string): Promise<Booking | null>;
  findByUserId(userId: string): Promise<Booking[]>;
  isSeatBooked(seatId: string, trainId: string, travelDate: Date): Promise<boolean>;
  findActiveByTrainId(trainId: string): Promise<Booking[]>;
}
