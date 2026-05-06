import { CancelBookingCommand } from './cancel-booking.command';
import { BookingRepository } from '../../../domain/repositories/booking-repository';
import { NotFoundError } from '../../../domain/errors/domain-error';

export class CancelBookingCommandHandler {
  constructor(private readonly bookingRepo: BookingRepository) {}

  async handle(command: CancelBookingCommand): Promise<void> {
    const booking = await this.bookingRepo.findById(command.bookingId);
    if (!booking) throw new NotFoundError(`Booking ${command.bookingId} not found`);

    booking.cancel(command.userId);
    await this.bookingRepo.save(booking);
  }
}
