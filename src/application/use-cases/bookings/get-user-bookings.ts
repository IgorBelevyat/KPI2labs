import { BookingResultDto } from '../../dto/booking-dto';
import { BookingRepository } from '../../../domain/repositories/booking-repository';

export class GetUserBookingsUseCase {
  constructor(private readonly bookingRepo: BookingRepository) {}

  async execute(userId: string): Promise<BookingResultDto[]> {
    const bookings = await this.bookingRepo.findByUserId(userId);
    return bookings.map((b) => ({
      id: b.id,
      userId: b.userId,
      trainId: b.trainId,
      seatId: b.seatId,
      travelDate: b.travelDate.toISOString(),
      status: b.status,
      createdAt: b.createdAt.toISOString(),
    }));
  }
}
