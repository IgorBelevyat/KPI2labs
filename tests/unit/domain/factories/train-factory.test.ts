import { TrainFactory } from '../../../../src/domain/factories/train-factory';
import { Train } from '../../../../src/domain/models/train';
import { Route, RouteStop } from '../../../../src/domain/models/route';
import { TrainNumber } from '../../../../src/domain/value-objects/train-number';
import { TimeRange } from '../../../../src/domain/value-objects/time-range';
import { InMemoryTrainRepo, InMemoryRouteRepo } from '../../../helpers/in-memory-repos';
import { ConflictError, NotFoundError } from '../../../../src/domain/errors/domain-error';

describe('TrainFactory', () => {
  const route = new Route('route-1', [
    new RouteStop('s-1', 0), new RouteStop('s-2', 1),
  ]);

  it('should create a train', async () => {
    const routeRepo = new InMemoryRouteRepo();
    routeRepo.seed([route]);
    const factory = new TrainFactory(new InMemoryTrainRepo(), routeRepo);
    const train = await factory.create('K42', 'route-1', new Date('2027-06-01T08:00Z'), new Date('2027-06-01T14:00Z'));
    expect(train.number.value).toBe('K42');
    expect(train.routeId).toBe('route-1');
  });

  it('should throw on duplicate train number', async () => {
    const trainRepo = new InMemoryTrainRepo();
    const existing = new Train('t-1', new TrainNumber('K42'), 'route-1',
      new TimeRange(new Date('2027-06-01T08:00Z'), new Date('2027-06-01T14:00Z')));
    await trainRepo.save(existing);

    const routeRepo = new InMemoryRouteRepo();
    routeRepo.seed([route]);
    const factory = new TrainFactory(trainRepo, routeRepo);
    await expect(
      factory.create('K42', 'route-1', new Date('2027-07-01T08:00Z'), new Date('2027-07-01T14:00Z'))
    ).rejects.toThrow(ConflictError);
  });

  it('should throw if route does not exist', async () => {
    const factory = new TrainFactory(new InMemoryTrainRepo(), new InMemoryRouteRepo());
    await expect(
      factory.create('K42', 'nonexistent', new Date('2027-06-01T08:00Z'), new Date('2027-06-01T14:00Z'))
    ).rejects.toThrow(NotFoundError);
  });
});
