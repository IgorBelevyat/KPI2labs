import { BookingResultDto } from '../../dto/booking-dto';
import { BookingRepository } from '../../../domain/repositories/booking-repository';
import { NotFoundError } from '../../../domain/errors/domain-error';

export class CancelBookingUseCase {
  constructor(private readonly bookingRepo: BookingRepository) { }

  async execute(bookingId: string, userId: string): Promise<BookingResultDto> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundError(`Booking ${bookingId} not found`);

    booking.cancel(userId);
    await this.bookingRepo.save(booking);

    return {
      id: booking.id,
      userId: booking.userId,
      trainId: booking.trainId,
      seatId: booking.seatId,
      travelDate: booking.travelDate.toISOString(),
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
    };
  }
}
