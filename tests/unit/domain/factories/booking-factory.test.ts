import { BookingFactory } from '../../../../src/domain/factories/booking-factory';
import { Booking } from '../../../../src/domain/models/booking';
import { Train, Carriage, Seat } from '../../../../src/domain/models/train';
import { TrainNumber } from '../../../../src/domain/value-objects/train-number';
import { TimeRange } from '../../../../src/domain/value-objects/time-range';
import { InMemoryBookingRepo, InMemoryTrainRepo } from '../../../helpers/in-memory-repos';
import { NotFoundError, ConflictError, DomainError } from '../../../../src/domain/errors/domain-error';

const makeTrain = () => {
  const seats = [new Seat('seat-1', 1, 'car-1'), new Seat('seat-2', 2, 'car-1')];
  const carriage = new Carriage('car-1', 1, 'coupe', 'train-1', seats);
  return new Train(
    'train-1', new TrainNumber('K42'), 'route-1',
    new TimeRange(new Date('2027-06-01T08:00Z'), new Date('2027-06-01T14:00Z')),
    [carriage]
  );
};

describe('BookingFactory', () => {
  let bookingRepo: InMemoryBookingRepo;
  let trainRepo: InMemoryTrainRepo;
  let factory: BookingFactory;

  beforeEach(() => {
    bookingRepo = new InMemoryBookingRepo();
    trainRepo = new InMemoryTrainRepo();
    factory = new BookingFactory(bookingRepo, trainRepo);
  });

  it('should create a valid booking', async () => {
    await trainRepo.save(makeTrain());
    const booking = await factory.create('user-1', 'train-1', 'seat-1', new Date('2027-06-15'));
    expect(booking.userId).toBe('user-1');
    expect(booking.trainId).toBe('train-1');
    expect(booking.seatId).toBe('seat-1');
    expect(booking.status).toBe('created');
  });

  it('should throw if train not found', async () => {
    await expect(
      factory.create('user-1', 'nonexistent', 'seat-1', new Date('2027-06-15'))
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw if seat not found in train', async () => {
    await trainRepo.save(makeTrain());
    await expect(
      factory.create('user-1', 'train-1', 'nonexistent-seat', new Date('2027-06-15'))
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw if seat already booked', async () => {
    await trainRepo.save(makeTrain());
    const existing = new Booking('b-1', 'user-2', 'train-1', 'seat-1', new Date('2027-06-15'));
    await bookingRepo.save(existing);

    await expect(
      factory.create('user-1', 'train-1', 'seat-1', new Date('2027-06-15'))
    ).rejects.toThrow(ConflictError);
  });

  it('should throw if travel date is in the past', async () => {
    await trainRepo.save(makeTrain());
    await expect(
      factory.create('user-1', 'train-1', 'seat-1', new Date('2020-01-01'))
    ).rejects.toThrow(DomainError);
  });
});
