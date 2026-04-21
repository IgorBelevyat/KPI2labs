import { TimeRange } from '../../../../src/domain/value-objects/time-range';
import { DomainError } from '../../../../src/domain/errors/domain-error';

describe('TimeRange Value Object', () => {
  it('should create valid time range', () => {
    const dep = new Date('2025-06-01T08:00:00Z');
    const arr = new Date('2025-06-01T14:00:00Z');
    const range = new TimeRange(dep, arr);
    expect(range.departure).toEqual(dep);
    expect(range.arrival).toEqual(arr);
  });

  it('should throw if departure >= arrival', () => {
    const same = new Date('2025-06-01T10:00:00Z');
    expect(() => new TimeRange(same, same)).toThrow(DomainError);
  });

  it('should throw if departure after arrival', () => {
    const dep = new Date('2025-06-01T15:00:00Z');
    const arr = new Date('2025-06-01T10:00:00Z');
    expect(() => new TimeRange(dep, arr)).toThrow(DomainError);
  });

  it('should calculate duration in minutes', () => {
    const dep = new Date('2025-06-01T08:00:00Z');
    const arr = new Date('2025-06-01T10:30:00Z');
    const range = new TimeRange(dep, arr);
    expect(range.durationMinutes()).toBe(150);
  });

  it('should compare equality', () => {
    const dep = new Date('2025-06-01T08:00:00Z');
    const arr = new Date('2025-06-01T10:00:00Z');
    const a = new TimeRange(dep, arr);
    const b = new TimeRange(new Date(dep), new Date(arr));
    expect(a.equals(b)).toBe(true);
  });
});
