import { CreateBookingCommand } from './create-booking.command';
import { BookingFactory } from '../../../domain/factories/booking-factory';
import { BookingRepository } from '../../../domain/repositories/booking-repository';
import { NotificationService } from '../../interfaces/notification-service';
import { EventBus } from '../../../../../shared/event-bus/event-bus.interface';

export class CreateBookingCommandHandler {
  constructor(
    private readonly bookingFactory: BookingFactory,
    private readonly bookingRepo: BookingRepository,
    private readonly notificationService?: NotificationService,
    private readonly eventBus?: EventBus
  ) { }

  async handle(command: CreateBookingCommand): Promise<{ id: string }> {
    const booking = await this.bookingFactory.create(
      command.userId,
      command.trainId,
      command.seatId,
      new Date(command.travelDate)
    );
    await this.bookingRepo.save(booking);

    const notificationData = {
      bookingId: booking.id,
      userId: command.userId,
      trainId: command.trainId,
      seatId: command.seatId,
      travelDate: command.travelDate,
    };

    if (this.eventBus) {
      await this.eventBus.publish({
        type: 'BookingCreated',
        occurredAt: new Date().toISOString(),
        ...notificationData,
      });
    } else if (this.notificationService) {
      try {
        await this.notificationService.sendBookingConfirmation(notificationData);
      } catch (err) {
        console.error('[SYNC] Notification failed, booking saved:', err);
      }
    }

    return { id: booking.id };
  }
}
