import { GetUserBookingsQuery } from './get-user-bookings.query';
import { BookingReadModel } from './booking.read-model';
import { BookingReadRepository } from '../../interfaces/booking-read-repository';

export class GetUserBookingsQueryHandler {
  constructor(private readonly readRepo: BookingReadRepository) {}

  async handle(query: GetUserBookingsQuery): Promise<BookingReadModel[]> {
    return this.readRepo.findUserBookingsWithDetails(query.userId);
  }
}
