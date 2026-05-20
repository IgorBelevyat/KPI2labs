import { CancelBookingCommand } from './cancel-booking.command';
import { BookingRepository } from '../../../domain/repositories/booking-repository';
import { NotFoundError } from '../../../../../shared/errors/domain-error';
import { NotificationService } from '../../interfaces/notification-service';
import { EventBus } from '../../../../../shared/event-bus/event-bus.interface';


export class CancelBookingCommandHandler {
  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly notificationService?: NotificationService,
    private readonly eventBus?: EventBus
  ) { }

  async handle(command: CancelBookingCommand): Promise<void> {
    const booking = await this.bookingRepo.findById(command.bookingId);
    if (!booking) throw new NotFoundError(`Booking ${command.bookingId} not found`);

    booking.cancel(command.userId);
    await this.bookingRepo.save(booking);

    if (this.eventBus) {
      await this.eventBus.publish({
        type: 'BookingCancelled',
        occurredAt: new Date().toISOString(),
        bookingId: command.bookingId,
        userId: command.userId,
      });
    } else if (this.notificationService) {
      try {
        await this.notificationService.sendBookingCancellation({
          bookingId: booking.id,
          userId: booking.userId,
          trainId: booking.trainId,
          seatId: booking.seatId,
          travelDate: booking.travelDate.toISOString(),
        });
      } catch (err) {
        console.error('[SYNC] Notification failed, booking cancelled:', err);
      }
    }
  }
}
