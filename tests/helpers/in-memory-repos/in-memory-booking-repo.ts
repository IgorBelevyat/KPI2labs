import { Booking } from '../../../src/domain/models/booking';
import { BookingRepository } from '../../../src/domain/repositories/booking-repository';

export class InMemoryBookingRepo implements BookingRepository {
  private bookings: Booking[] = [];

  async save(b: Booking): Promise<void> { this.bookings.push(b); }
  async findById(id: string): Promise<Booking | null> { return this.bookings.find(b => b.id === id) ?? null; }
  async findByUserId(userId: string): Promise<Booking[]> { return this.bookings.filter(b => b.userId === userId); }
  async isSeatBooked(seatId: string, trainId: string, date: Date): Promise<boolean> {
    return this.bookings.some(b =>
      b.seatId === seatId && b.trainId === trainId &&
      b.travelDate.toDateString() === date.toDateString() && b.isActive
    );
  }
  async findActiveByTrainId(trainId: string): Promise<Booking[]> {
    return this.bookings.filter(b => b.trainId === trainId && b.isActive);
  }

  seed(bookings: Booking[]): void { this.bookings = [...bookings]; }
}
