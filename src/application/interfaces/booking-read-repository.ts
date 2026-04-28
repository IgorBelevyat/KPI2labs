import { BookingResultDto } from '../dto/booking-dto';

export interface BookingReadRepository {
  findUserBookingsWithDetails(userId: string): Promise<BookingResultDto[]>;
}
