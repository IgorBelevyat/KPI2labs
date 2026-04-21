import { RouteFactory } from '../../../../src/domain/factories/route-factory';
import { Station } from '../../../../src/domain/models/station';
import { InMemoryStationRepo } from '../../../helpers/in-memory-repos';
import { NotFoundError, DomainError } from '../../../../src/domain/errors/domain-error';

describe('RouteFactory', () => {
  it('should create a route when all stations exist', async () => {
    const repo = new InMemoryStationRepo();
    repo.seed([new Station('s-1', 'Kyiv', 'Kyiv'), new Station('s-2', 'Lviv', 'Lviv')]);
    const factory = new RouteFactory(repo);
    const route = await factory.create([
      { stationId: 's-1', orderIndex: 0 },
      { stationId: 's-2', orderIndex: 1 },
    ]);
    expect(route.stops).toHaveLength(2);
  });

  it('should throw if station does not exist', async () => {
    const repo = new InMemoryStationRepo();
    repo.seed([new Station('s-1', 'Kyiv', 'Kyiv')]);
    const factory = new RouteFactory(repo);
    await expect(factory.create([
      { stationId: 's-1', orderIndex: 0 },
      { stationId: 'nonexistent', orderIndex: 1 },
    ])).rejects.toThrow(NotFoundError);
  });

  it('should throw if less than 2 stops', async () => {
    const repo = new InMemoryStationRepo();
    repo.seed([new Station('s-1', 'Kyiv', 'Kyiv')]);
    const factory = new RouteFactory(repo);
    await expect(factory.create([
      { stationId: 's-1', orderIndex: 0 },
    ])).rejects.toThrow(DomainError);
  });
});
