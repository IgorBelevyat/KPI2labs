import { Station } from '../../../../src/domain/models/station';
import { DomainError } from '../../../../src/domain/errors/domain-error';

describe('Station Entity', () => {
  it('should create a valid station', () => {
    const s = new Station('id-1', 'Kyiv-Pasazhyrskyi', 'Kyiv');
    expect(s.id).toBe('id-1');
    expect(s.name).toBe('Kyiv-Pasazhyrskyi');
    expect(s.city).toBe('Kyiv');
  });

  it('should trim name and city', () => {
    const s = new Station('id-1', '  Lviv  ', '  Lviv  ');
    expect(s.name).toBe('Lviv');
    expect(s.city).toBe('Lviv');
  });

  it('should throw on empty name', () => {
    expect(() => new Station('id-1', '', 'Kyiv')).toThrow(DomainError);
  });

  it('should throw on empty city', () => {
    expect(() => new Station('id-1', 'Central', '')).toThrow(DomainError);
  });

  it('should update details', () => {
    const s = new Station('id-1', 'Old Name', 'Old City');
    s.updateDetails('New Name', 'New City');
    expect(s.name).toBe('New Name');
    expect(s.city).toBe('New City');
  });

  it('should throw on update with empty name', () => {
    const s = new Station('id-1', 'Name', 'City');
    expect(() => s.updateDetails('', 'City')).toThrow(DomainError);
  });

  it('should compare equality by id', () => {
    const a = new Station('id-1', 'A', 'A');
    const b = new Station('id-1', 'B', 'B');
    expect(a.equals(b)).toBe(true);
  });
});
