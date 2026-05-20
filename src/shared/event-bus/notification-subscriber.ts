import { NotificationService } from '../../modules/booking/application/interfaces/notification-service';
import { IntegrationEvent, BookingCreated, BookingCancelled } from '../../domain/events/integration-events';

export class NotificationSubscriber {
  constructor(private readonly notificationService: NotificationService) { }

  async onBookingCreated(event: IntegrationEvent): Promise<void> {
    const e = event as BookingCreated;
    console.log(`[NotificationSubscriber] Received BookingCreated: ${e.bookingId}`);
    await this.notificationService.sendBookingConfirmation({
      bookingId: e.bookingId,
      userId: e.userId,
      trainId: e.trainId,
      seatId: e.seatId,
      travelDate: e.travelDate,
    });
  }


  async onBookingCancelled(event: IntegrationEvent): Promise<void> {
    const e = event as BookingCancelled;
    console.log(`[NotificationSubscriber] Received BookingCancelled: ${e.bookingId}`);
    await this.notificationService.sendBookingCancellation({
      bookingId: e.bookingId,
      userId: e.userId,
      trainId: '',
      seatId: '',
      travelDate: '',
    });
  }
}
