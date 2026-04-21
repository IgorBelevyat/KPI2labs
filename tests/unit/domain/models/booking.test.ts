import { Booking } from '../../../../src/domain/models/booking';
import { DomainError, AuthorizationError } from '../../../../src/domain/errors/domain-error';

describe('Booking Entity', () => {
  const makeBooking = (overrides?: Partial<{ userId: string; status: 'created' | 'cancelled' }>) => {
    return new Booking(
      'b-1',
      overrides?.userId ?? 'user-1',
      'train-1',
      'seat-1',
      new Date('2025-06-15'),
      overrides?.status ?? 'created'
    );
  };

  it('should create a booking with default status "created"', () => {
    const b = makeBooking();
    expect(b.status).toBe('created');
    expect(b.isActive).toBe(true);
  });

  it('should cancel booking by owner', () => {
    const b = makeBooking();
    b.cancel('user-1');
    expect(b.status).toBe('cancelled');
    expect(b.isActive).toBe(false);
  });

  it('should throw if non-owner tries to cancel', () => {
    const b = makeBooking({ userId: 'user-1' });
    expect(() => b.cancel('user-2')).toThrow(AuthorizationError);
  });

  it('should throw if already cancelled', () => {
    const b = makeBooking({ status: 'cancelled' });
    expect(() => b.cancel('user-1')).toThrow(DomainError);
    expect(() => b.cancel('user-1')).toThrow('already cancelled');
  });

  it('should compare equality by id', () => {
    const a = new Booking('b-1', 'u-1', 't-1', 's-1', new Date());
    const b = new Booking('b-1', 'u-2', 't-2', 's-2', new Date());
    expect(a.equals(b)).toBe(true);
  });
});
