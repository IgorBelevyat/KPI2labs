import { NotificationSubscriber } from '../../../../src/infrastructure/messaging/notification-subscriber';
import { NotificationService, BookingNotificationData, WelcomeNotificationData } from '../../../../src/application/interfaces/notification-service';
import { BookingCreated, BookingCancelled } from '../../../../src/domain/events/integration-events';

// ── Test double ──────────────────────────────────────────────────────

class MockNotificationService implements NotificationService {
  confirmations: BookingNotificationData[] = [];
  cancellations: BookingNotificationData[] = [];

  async sendBookingConfirmation(data: BookingNotificationData): Promise<void> {
    this.confirmations.push(data);
  }
  async sendBookingCancellation(data: BookingNotificationData): Promise<void> {
    this.cancellations.push(data);
  }
  async sendWelcome(_data: WelcomeNotificationData): Promise<void> {}
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('NotificationSubscriber', () => {
  let notifier: MockNotificationService;
  let subscriber: NotificationSubscriber;

  beforeEach(() => {
    notifier = new MockNotificationService();
    subscriber = new NotificationSubscriber(notifier);
  });

  it('should call sendBookingConfirmation on BookingCreated event', async () => {
    const event: BookingCreated = {
      type: 'BookingCreated',
      occurredAt: '2027-06-15T10:00:00Z',
      bookingId: 'b-1',
      userId: 'u-1',
      trainId: 't-1',
      seatId: 's-1',
      travelDate: '2027-06-15',
    };

    await subscriber.onBookingCreated(event);

    expect(notifier.confirmations).toHaveLength(1);
    expect(notifier.confirmations[0].bookingId).toBe('b-1');
    expect(notifier.confirmations[0].userId).toBe('u-1');
    expect(notifier.confirmations[0].trainId).toBe('t-1');
  });

  it('should call sendBookingCancellation on BookingCancelled event', async () => {
    const event: BookingCancelled = {
      type: 'BookingCancelled',
      occurredAt: '2027-06-15T12:00:00Z',
      bookingId: 'b-2',
      userId: 'u-2',
    };

    await subscriber.onBookingCancelled(event);

    expect(notifier.cancellations).toHaveLength(1);
    expect(notifier.cancellations[0].bookingId).toBe('b-2');
  });

  it('should handle multiple events independently', async () => {
    const event1: BookingCreated = {
      type: 'BookingCreated',
      occurredAt: '2027-06-15T10:00:00Z',
      bookingId: 'b-1', userId: 'u-1', trainId: 't-1', seatId: 's-1', travelDate: '2027-06-15',
    };
    const event2: BookingCreated = {
      type: 'BookingCreated',
      occurredAt: '2027-06-15T10:05:00Z',
      bookingId: 'b-2', userId: 'u-2', trainId: 't-2', seatId: 's-2', travelDate: '2027-06-16',
    };

    await subscriber.onBookingCreated(event1);
    await subscriber.onBookingCreated(event2);

    expect(notifier.confirmations).toHaveLength(2);
    expect(notifier.confirmations[0].bookingId).toBe('b-1');
    expect(notifier.confirmations[1].bookingId).toBe('b-2');
  });
});
