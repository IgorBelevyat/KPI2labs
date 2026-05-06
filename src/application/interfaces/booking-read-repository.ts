import { BookingReadModel } from '../queries/bookings/booking.read-model';

export interface BookingReadRepository {
  findUserBookingsWithDetails(userId: string): Promise<BookingReadModel[]>;
}
