import { BookingFactory } from '../../../../src/modules/booking/domain/factories/booking-factory';
import { Booking } from '../../../../src/modules/booking/domain/models/booking';
import { InMemoryBookingRepo } from '../../../helpers/in-memory-repos/in-memory-booking-repo';
import { NotFoundError, ConflictError, DomainError } from '../../../../src/shared/errors/domain-error';
import { CatalogService, TrainInfo } from '../../../../src/modules/booking/domain/repositories/catalog-service.interface';

class MockCatalogService implements CatalogService {
  trains: Record<string, { id: string, routeId: string, seats: string[] }> = {};

  async getTrainInfo(trainId: string): Promise<TrainInfo | null> {
    const t = this.trains[trainId];
    return t ? { id: t.id, routeId: t.routeId } : null;
  }
  async verifySeatExists(trainId: string, seatId: string): Promise<boolean> {
    const t = this.trains[trainId];
    return t ? t.seats.includes(seatId) : false;
  }
}

describe('BookingFactory', () => {
  let bookingRepo: InMemoryBookingRepo;
  let catalogService: MockCatalogService;
  let factory: BookingFactory;

  beforeEach(() => {
    bookingRepo = new InMemoryBookingRepo();
    catalogService = new MockCatalogService();
    factory = new BookingFactory(bookingRepo, catalogService);
  });

  it('should create a valid booking', async () => {
    catalogService.trains['train-1'] = { id: 'train-1', routeId: 'route-1', seats: ['seat-1', 'seat-2'] };
    const booking = await factory.create('user-1', 'train-1', 'seat-1', new Date('2027-06-15'));
    expect(booking.userId).toBe('user-1');
    expect(booking.trainId).toBe('train-1');
    expect(booking.seatId).toBe('seat-1');
    expect(booking.status).toBe('created');
  });

  it('should throw NotFoundError if train does not exist', async () => {
    await expect(factory.create('u1', 'invalid-train', 'seat-1', new Date('2027-06-15')))
      .rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError if seat does not exist in train', async () => {
    catalogService.trains['train-1'] = { id: 'train-1', routeId: 'route-1', seats: ['seat-1', 'seat-2'] };
    await expect(factory.create('u1', 'train-1', 'invalid-seat', new Date('2027-06-15')))
      .rejects.toThrow(NotFoundError);
  });

  it('should throw ConflictError if seat is already booked', async () => {
    catalogService.trains['train-1'] = { id: 'train-1', routeId: 'route-1', seats: ['seat-1', 'seat-2'] };
    await bookingRepo.save(new Booking('b1', 'u1', 'train-1', 'seat-1', new Date('2027-06-15')));
    
    await expect(factory.create('u2', 'train-1', 'seat-1', new Date('2027-06-15')))
      .rejects.toThrow(ConflictError);
  });

  it('should throw if travel date is in the past', async () => {
    catalogService.trains['train-1'] = { id: 'train-1', routeId: 'route-1', seats: ['seat-1', 'seat-2'] };
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await expect(
      factory.create('user-1', 'train-1', 'seat-1', pastDate)
    ).rejects.toThrow(DomainError);
  });
});
