import { DomainError } from '../errors/domain-error';

export class TimeRange {
  private readonly _departure: Date;
  private readonly _arrival: Date;

  constructor(departure: Date, arrival: Date) {
    if (departure >= arrival) {
      throw new DomainError(
        `Departure time must be before arrival time: ${departure.toISOString()} >= ${arrival.toISOString()}`
      );
    }
    this._departure = departure;
    this._arrival = arrival;
  }

  get departure(): Date { return this._departure; }
  get arrival(): Date { return this._arrival; }

  durationMinutes(): number {
    return Math.round((this._arrival.getTime() - this._departure.getTime()) / 60000);
  }

  isInPast(): boolean { return this._departure < new Date(); }

  equals(other: TimeRange): boolean {
    return this._departure.getTime() === other._departure.getTime() &&
           this._arrival.getTime() === other._arrival.getTime();
  }
}
