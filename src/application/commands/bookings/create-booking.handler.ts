import { CreateBookingCommand } from './create-booking.command';
import { BookingFactory } from '../../../domain/factories/booking-factory';
import { BookingRepository } from '../../../domain/repositories/booking-repository';

export class CreateBookingCommandHandler {
  constructor(
    private readonly bookingFactory: BookingFactory,
    private readonly bookingRepo: BookingRepository
  ) {}

  async handle(command: CreateBookingCommand): Promise<{ id: string }> {
    const booking = await this.bookingFactory.create(
      command.userId,
      command.trainId,
      command.seatId,
      new Date(command.travelDate)
    );
    await this.bookingRepo.save(booking);
    return { id: booking.id };
  }
}
