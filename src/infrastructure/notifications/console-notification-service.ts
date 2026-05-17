import {
  NotificationService,
  BookingNotificationData,
  WelcomeNotificationData,
} from '../../application/interfaces/notification-service';

export class ConsoleNotificationService implements NotificationService {
  async sendBookingConfirmation(data: BookingNotificationData): Promise<void> {
    console.log(
      `[NOTIFICATION] Booking confirmed | bookingId=${data.bookingId} userId=${data.userId} ` +
      `train=${data.trainId} seat=${data.seatId} date=${data.travelDate}`
    );
  }

  async sendBookingCancellation(data: BookingNotificationData): Promise<void> {
    console.log(
      `[NOTIFICATION] Booking cancelled | bookingId=${data.bookingId} userId=${data.userId} ` +
      `train=${data.trainId} seat=${data.seatId} date=${data.travelDate}`
    );
  }

  async sendWelcome(data: WelcomeNotificationData): Promise<void> {
    console.log(
      `[NOTIFICATION] Welcome | userId=${data.userId} name=${data.userName} email=${data.email}`
    );
  }
}
