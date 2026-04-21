import { DomainError } from '../errors/domain-error';
import { TrainNumber } from '../value-objects/train-number';
import { TimeRange } from '../value-objects/time-range';

export class Seat {
  constructor(
    public readonly id: string,
    public readonly number: number,
    public readonly carriageId: string
  ) {}
}

export type CarriageType = 'platskart' | 'coupe' | 'sv';

export class Carriage {
  private readonly _id: string;
  private readonly _number: number;
  private readonly _type: CarriageType;
  private readonly _trainId: string;
  private _seats: Seat[];

  constructor(id: string, number: number, type: CarriageType, trainId: string, seats: Seat[] = []) {
    this._id = id;
    this._number = number;
    this._type = type;
    this._trainId = trainId;
    this._seats = seats;
  }

  get id(): string { return this._id; }
  get number(): number { return this._number; }
  get type(): CarriageType { return this._type; }
  get trainId(): string { return this._trainId; }
  get seats(): ReadonlyArray<Seat> { return [...this._seats]; }
  get seatCount(): number { return this._seats.length; }
}

export class Train {
  private readonly _id: string;
  private _number: TrainNumber;
  private _routeId: string;
  private _schedule: TimeRange;
  private _carriages: Carriage[];

  constructor(id: string, number: TrainNumber, routeId: string, schedule: TimeRange, carriages: Carriage[] = []) {
    this._id = id;
    this._number = number;
    this._routeId = routeId;
    this._schedule = schedule;
    this._carriages = carriages;
  }

  get id(): string { return this._id; }
  get number(): TrainNumber { return this._number; }
  get routeId(): string { return this._routeId; }
  get schedule(): TimeRange { return this._schedule; }
  get carriages(): ReadonlyArray<Carriage> { return [...this._carriages]; }

  updateDetails(number: TrainNumber, routeId: string, schedule: TimeRange): void {
    this._number = number;
    this._routeId = routeId;
    this._schedule = schedule;
  }

  addCarriage(carriage: Carriage): void {
    if (this._carriages.some((c) => c.number === carriage.number)) {
      throw new DomainError(`Carriage number ${carriage.number} already exists in this train`);
    }
    this._carriages.push(carriage);
  }

  findSeatById(seatId: string): Seat | undefined {
    for (const carriage of this._carriages) {
      const seat = carriage.seats.find((s) => s.id === seatId);
      if (seat) return seat;
    }
    return undefined;
  }

  equals(other: Train): boolean { return this._id === other._id; }
}
