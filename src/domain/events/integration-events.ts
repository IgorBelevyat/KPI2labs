export interface BookingCreated {
  readonly type: 'BookingCreated';
  readonly occurredAt: string;
  readonly bookingId: string;
  readonly userId: string;
  readonly trainId: string;
  readonly seatId: string;
  readonly travelDate: string;
}

export interface BookingCancelled {
  readonly type: 'BookingCancelled';
  readonly occurredAt: string;
  readonly bookingId: string;
  readonly userId: string;
}

export type IntegrationEvent = BookingCreated | BookingCancelled;
