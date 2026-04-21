import { Train, Carriage, Seat } from '../../../../src/domain/models/train';
import { TrainNumber } from '../../../../src/domain/value-objects/train-number';
import { TimeRange } from '../../../../src/domain/value-objects/time-range';
import { DomainError } from '../../../../src/domain/errors/domain-error';

describe('Train Aggregate', () => {
  const makeSchedule = () => new TimeRange(
    new Date('2025-06-01T08:00:00Z'),
    new Date('2025-06-01T14:00:00Z')
  );

  it('should create a valid train', () => {
    const train = new Train('t-1', new TrainNumber('K42'), 'route-1', makeSchedule());
    expect(train.id).toBe('t-1');
    expect(train.number.value).toBe('K42');
    expect(train.routeId).toBe('route-1');
    expect(train.carriages).toHaveLength(0);
  });

  it('should add a carriage', () => {
    const train = new Train('t-1', new TrainNumber('K42'), 'route-1', makeSchedule());
    const carriage = new Carriage('c-1', 1, 'coupe', 't-1');
    train.addCarriage(carriage);
    expect(train.carriages).toHaveLength(1);
  });

  it('should throw on duplicate carriage number', () => {
    const train = new Train('t-1', new TrainNumber('K42'), 'route-1', makeSchedule());
    train.addCarriage(new Carriage('c-1', 1, 'coupe', 't-1'));
    expect(() => train.addCarriage(new Carriage('c-2', 1, 'platskart', 't-1'))).toThrow(DomainError);
  });

  it('should find seat by id', () => {
    const seats = [new Seat('s-1', 1, 'c-1'), new Seat('s-2', 2, 'c-1')];
    const carriage = new Carriage('c-1', 1, 'coupe', 't-1', seats);
    const train = new Train('t-1', new TrainNumber('K42'), 'route-1', makeSchedule(), [carriage]);

    expect(train.findSeatById('s-1')).toBeDefined();
    expect(train.findSeatById('s-1')!.number).toBe(1);
    expect(train.findSeatById('nonexistent')).toBeUndefined();
  });

  it('should update details', () => {
    const train = new Train('t-1', new TrainNumber('K42'), 'route-1', makeSchedule());
    const newSchedule = new TimeRange(
      new Date('2025-07-01T10:00:00Z'),
      new Date('2025-07-01T18:00:00Z')
    );
    train.updateDetails(new TrainNumber('L99'), 'route-2', newSchedule);
    expect(train.number.value).toBe('L99');
    expect(train.routeId).toBe('route-2');
  });
});
