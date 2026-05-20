import { CancelBookingCommandHandler } from '../../../../src/modules/booking/application/commands/bookings/cancel-booking.handler';
import { Booking } from '../../../../src/modules/booking/domain/models/booking';
import { InMemoryBookingRepo } from '../../../helpers/in-memory-repos';
import { NotificationService, BookingNotificationData, WelcomeNotificationData } from '../../../../src/modules/booking/application/interfaces/notification-service';
import { EventBus } from '../../../../src/shared/event-bus/event-bus.interface';
import { IntegrationEvent } from '../../../../src/domain/events/integration-events';

// ── Test doubles ──────────────────────────────────────────────────────

class MockNotificationService implements NotificationService {
  cancellationCalls: BookingNotificationData[] = [];
  shouldFail = false;

  async sendBookingConfirmation(_data: BookingNotificationData): Promise<void> {}
  async sendBookingCancellation(data: BookingNotificationData): Promise<void> {
    if (this.shouldFail) throw new Error('Notification service unavailable');
    this.cancellationCalls.push(data);
  }
  async sendWelcome(_data: WelcomeNotificationData): Promise<void> {}
}

class MockEventBus implements EventBus {
  published: IntegrationEvent[] = [];

  async publish(event: IntegrationEvent): Promise<void> {
    this.published.push(event);
  }
  subscribe(_eventType: string, _handler: (event: IntegrationEvent) => Promise<void>): void {}
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('CancelBookingCommandHandler', () => {
  let bookingRepo: InMemoryBookingRepo;

  const makeBooking = () => new Booking(
    'booking-1', 'user-1', 'train-1', 'seat-1', new Date('2027-06-15')
  );

  beforeEach(() => {
    bookingRepo = new InMemoryBookingRepo();
  });

  describe('SYNC mode', () => {
    it('should cancel booking and call NotificationService', async () => {
      const notifier = new MockNotificationService();
      const handler = new CancelBookingCommandHandler(bookingRepo, notifier, undefined);
      bookingRepo.seed([makeBooking()]);

      await handler.handle({ bookingId: 'booking-1', userId: 'user-1' });

      const booking = await bookingRepo.findById('booking-1');
      expect(booking!.status).toBe('cancelled');
      expect(notifier.cancellationCalls).toHaveLength(1);
      expect(notifier.cancellationCalls[0].bookingId).toBe('booking-1');
    });

    it('should cancel booking even if NotificationService fails', async () => {
      const notifier = new MockNotificationService();
      notifier.shouldFail = true;
      const handler = new CancelBookingCommandHandler(bookingRepo, notifier, undefined);
      bookingRepo.seed([makeBooking()]);

      await handler.handle({ bookingId: 'booking-1', userId: 'user-1' });

      const booking = await bookingRepo.findById('booking-1');
      expect(booking!.status).toBe('cancelled');
    });

    it('should not throw when NotificationService throws', async () => {
      const notifier = new MockNotificationService();
      notifier.shouldFail = true;
      const handler = new CancelBookingCommandHandler(bookingRepo, notifier, undefined);
      bookingRepo.seed([makeBooking()]);

      await expect(
        handler.handle({ bookingId: 'booking-1', userId: 'user-1' })
      ).resolves.not.toThrow();
    });
  });

  describe('ASYNC mode', () => {
    it('should cancel booking and publish BookingCancelled event', async () => {
      const eventBus = new MockEventBus();
      const handler = new CancelBookingCommandHandler(bookingRepo, undefined, eventBus);
      bookingRepo.seed([makeBooking()]);

      await handler.handle({ bookingId: 'booking-1', userId: 'user-1' });

      const booking = await bookingRepo.findById('booking-1');
      expect(booking!.status).toBe('cancelled');
      expect(eventBus.published).toHaveLength(1);
      expect(eventBus.published[0].type).toBe('BookingCancelled');

      const event = eventBus.published[0] as any;
      expect(event.bookingId).toBe('booking-1');
      expect(event.userId).toBe('user-1');
    });
  });

  describe('error cases', () => {
    it('should throw NotFoundError for non-existent booking', async () => {
      const handler = new CancelBookingCommandHandler(bookingRepo, undefined, undefined);

      await expect(
        handler.handle({ bookingId: 'nonexistent', userId: 'user-1' })
      ).rejects.toThrow('not found');
    });
  });
});
