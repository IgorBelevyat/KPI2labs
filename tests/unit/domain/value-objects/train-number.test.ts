import { TrainNumber } from '../../../../src/domain/value-objects/train-number';
import { DomainError } from '../../../../src/domain/errors/domain-error';

describe('TrainNumber Value Object', () => {
  it('should create valid train number', () => {
    const tn = new TrainNumber('abc123');
    expect(tn.value).toBe('ABC123');
  });

  it('should trim whitespace', () => {
    const tn = new TrainNumber('  K42  ');
    expect(tn.value).toBe('K42');
  });

  it('should throw on empty string', () => {
    expect(() => new TrainNumber('')).toThrow(DomainError);
  });

  it('should throw on whitespace-only', () => {
    expect(() => new TrainNumber('   ')).toThrow(DomainError);
  });

  it('should throw if exceeds 10 characters', () => {
    expect(() => new TrainNumber('12345678901')).toThrow(DomainError);
  });

  it('should compare equality', () => {
    const a = new TrainNumber('K42');
    const b = new TrainNumber('k42');
    expect(a.equals(b)).toBe(true);
  });
});
