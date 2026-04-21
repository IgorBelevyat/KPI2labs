import { StationFactory } from '../../../../src/domain/factories/station-factory';
import { Station } from '../../../../src/domain/models/station';
import { InMemoryStationRepo } from '../../../helpers/in-memory-repos';
import { ConflictError } from '../../../../src/domain/errors/domain-error';

describe('StationFactory', () => {
  let repo: InMemoryStationRepo;
  let factory: StationFactory;

  beforeEach(() => {
    repo = new InMemoryStationRepo();
    factory = new StationFactory(repo);
  });

  it('should create a station with unique name', async () => {
    const station = await factory.create('Kyiv-Pasazhyrskyi', 'Kyiv');
    expect(station.name).toBe('Kyiv-Pasazhyrskyi');
    expect(station.city).toBe('Kyiv');
    expect(station.id).toBeDefined();
  });

  it('should throw on duplicate station name', async () => {
    await repo.save(new Station('existing-id', 'Kyiv-Pasazhyrskyi', 'Kyiv'));
    await expect(factory.create('Kyiv-Pasazhyrskyi', 'Kyiv')).rejects.toThrow(ConflictError);
  });
});
