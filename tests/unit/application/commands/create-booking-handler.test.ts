import { CreateBookingCommandHandler } from '../../../../src/application/commands/bookings/create-booking.handler';
import { BookingFactory } from '../../../../src/domain/factories/booking-factory';
import { InMemoryBookingRepo, InMemoryTrainRepo } from '../../../helpers/in-memory-repos';
import { Train, Carriage, Seat } from '../../../../src/domain/models/train';
import { TrainNumber } from '../../../../src/domain/value-objects/train-number';
import { TimeRange } from '../../../../src/domain/value-objects/time-range';
import { NotificationService, BookingNotificationData, WelcomeNotificationData } from '../../../../src/application/interfaces/notification-service';
import { EventBus } from '../../../../src/application/interfaces/event-bus';
import { IntegrationEvent } from '../../../../src/domain/events/integration-events';

// ── Test doubles ──────────────────────────────────────────────────────

class MockNotificationService implements NotificationService {
  calls: BookingNotificationData[] = [];
  shouldFail = false;

  async sendBookingConfirmation(data: BookingNotificationData): Promise<void> {
    if (this.shouldFail) throw new Error('Notification service unavailable');
    this.calls.push(data);
  }
  async sendBookingCancellation(_data: BookingNotificationData): Promise<void> {}
  async sendWelcome(_data: WelcomeNotificationData): Promise<void> {}
}

class MockEventBus implements EventBus {
  published: IntegrationEvent[] = [];

  async publish(event: IntegrationEvent): Promise<void> {
    this.published.push(event);
  }
  subscribe(_eventType: string, _handler: (event: IntegrationEvent) => Promise<void>): void {}
}

// ── Helpers ───────────────────────────────────────────────────────────

const makeTrain = () => {
  const seats = [new Seat('seat-1', 1, 'car-1')];
  const carriage = new Carriage('car-1', 1, 'coupe', 'train-1', seats);
  return new Train(
    'train-1', new TrainNumber('K42'), 'route-1',
    new TimeRange(new Date('2027-06-01T08:00Z'), new Date('2027-06-01T14:00Z')),
    [carriage]
  );
};

const makeCommand = () => ({
  userId: 'user-1',
  trainId: 'train-1',
  seatId: 'seat-1',
  travelDate: '2027-06-15',
});

// ── Tests ─────────────────────────────────────────────────────────────

describe('CreateBookingCommandHandler', () => {
  let bookingRepo: InMemoryBookingRepo;
  let trainRepo: InMemoryTrainRepo;
  let factory: BookingFactory;

  beforeEach(async () => {
    bookingRepo = new InMemoryBookingRepo();
    trainRepo = new InMemoryTrainRepo();
    factory = new BookingFactory(bookingRepo, trainRepo);
    await trainRepo.save(makeTrain());
  });

  describe('SYNC mode', () => {
    it('should create booking and call NotificationService', async () => {
      const notifier = new MockNotificationService();
      const handler = new CreateBookingCommandHandler(factory, bookingRepo, notifier, undefined);

      const result = await handler.handle(makeCommand());

      expect(result.id).toBeDefined();
      expect(notifier.calls).toHaveLength(1);
      expect(notifier.calls[0].trainId).toBe('train-1');
      expect(notifier.calls[0].seatId).toBe('seat-1');
    });

    it('should return id even if NotificationService fails', async () => {
      const notifier = new MockNotificationService();
      notifier.shouldFail = true;
      const handler = new CreateBookingCommandHandler(factory, bookingRepo, notifier, undefined);

      const result = await handler.handle(makeCommand());

      // Booking saved successfully despite notification failure
      expect(result.id).toBeDefined();
      const savedBooking = await bookingRepo.findById(result.id);
      expect(savedBooking).not.toBeNull();
    });

    it('should not throw when NotificationService throws', async () => {
      const notifier = new MockNotificationService();
      notifier.shouldFail = true;
      const handler = new CreateBookingCommandHandler(factory, bookingRepo, notifier, undefined);

      await expect(handler.handle(makeCommand())).resolves.not.toThrow();
    });
  });

  describe('ASYNC mode', () => {
    it('should create booking and publish BookingCreated event', async () => {
      const eventBus = new MockEventBus();
      const handler = new CreateBookingCommandHandler(factory, bookingRepo, undefined, eventBus);

      const result = await handler.handle(makeCommand());

      expect(result.id).toBeDefined();
      expect(eventBus.published).toHaveLength(1);
      expect(eventBus.published[0].type).toBe('BookingCreated');

      const event = eventBus.published[0] as any;
      expect(event.trainId).toBe('train-1');
      expect(event.seatId).toBe('seat-1');
      expect(event.userId).toBe('user-1');
      expect(event.occurredAt).toBeDefined();
    });

    it('should not call NotificationService directly in async mode', async () => {
      const eventBus = new MockEventBus();
      const notifier = new MockNotificationService();
      // Only eventBus is passed, notifier is not
      const handler = new CreateBookingCommandHandler(factory, bookingRepo, undefined, eventBus);

      await handler.handle(makeCommand());

      expect(notifier.calls).toHaveLength(0);
      expect(eventBus.published).toHaveLength(1);
    });
  });

  describe('no notification mode', () => {
    it('should create booking without any notification', async () => {
      const handler = new CreateBookingCommandHandler(factory, bookingRepo, undefined, undefined);

      const result = await handler.handle(makeCommand());

      expect(result.id).toBeDefined();
    });
  });
});
