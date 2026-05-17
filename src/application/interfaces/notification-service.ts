export interface BookingNotificationData {
  bookingId: string;
  userId: string;
  trainId: string;
  seatId: string;
  travelDate: string;
}

export interface WelcomeNotificationData {
  userId: string;
  userName: string;
  email: string;
}


export interface NotificationService {
  sendBookingConfirmation(data: BookingNotificationData): Promise<void>;
  sendBookingCancellation(data: BookingNotificationData): Promise<void>;
  sendWelcome(data: WelcomeNotificationData): Promise<void>;
}
