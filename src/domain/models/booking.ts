import { DomainError, AuthorizationError } from '../errors/domain-error';

export type BookingStatus = 'created' | 'cancelled';

export class Booking {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _trainId: string;
  private readonly _seatId: string;
  private readonly _travelDate: Date;
  private _status: BookingStatus;
  private readonly _createdAt: Date;

  constructor(
    id: string, userId: string, trainId: string, seatId: string,
    travelDate: Date, status: BookingStatus = 'created', createdAt: Date = new Date()
  ) {
    this._id = id;
    this._userId = userId;
    this._trainId = trainId;
    this._seatId = seatId;
    this._travelDate = travelDate;
    this._status = status;
    this._createdAt = createdAt;
  }

  get id(): string { return this._id; }
  get userId(): string { return this._userId; }
  get trainId(): string { return this._trainId; }
  get seatId(): string { return this._seatId; }
  get travelDate(): Date { return this._travelDate; }
  get status(): BookingStatus { return this._status; }
  get createdAt(): Date { return this._createdAt; }
  get isActive(): boolean { return this._status === 'created'; }

  cancel(requestingUserId: string): void {
    if (this._userId !== requestingUserId) {
      throw new AuthorizationError('You can only cancel your own bookings');
    }
    if (this._status === 'cancelled') {
      throw new DomainError('Booking is already cancelled');
    }
    this._status = 'cancelled';
  }

  equals(other: Booking): boolean { return this._id === other._id; }
}
