import { DomainError } from '../errors/domain-error';

export class RouteStop {
  constructor(
    public readonly stationId: string,
    public readonly orderIndex: number
  ) {}
}

export class Route {
  private readonly _id: string;
  private _stops: RouteStop[];

  constructor(id: string, stops: RouteStop[]) {
    Route.validateStops(stops);
    this._id = id;
    this._stops = [...stops].sort((a, b) => a.orderIndex - b.orderIndex);
  }

  get id(): string { return this._id; }
  get stops(): ReadonlyArray<RouteStop> { return [...this._stops]; }
  get originStationId(): string { return this._stops[0].stationId; }
  get destinationStationId(): string { return this._stops[this._stops.length - 1].stationId; }

  updateStops(stops: RouteStop[]): void {
    Route.validateStops(stops);
    this._stops = [...stops].sort((a, b) => a.orderIndex - b.orderIndex);
  }

  containsStation(stationId: string): boolean {
    return this._stops.some((s) => s.stationId === stationId);
  }

  equals(other: Route): boolean { return this._id === other._id; }

  private static validateStops(stops: RouteStop[]): void {
    if (stops.length < 2) throw new DomainError('Route must contain at least 2 stations (origin and destination)');
    const sorted = [...stops].sort((a, b) => a.orderIndex - b.orderIndex);
    if (sorted[0].stationId === sorted[sorted.length - 1].stationId) {
      throw new DomainError('Origin and destination stations cannot be the same');
    }
    const indices = stops.map((s) => s.orderIndex);
    if (new Set(indices).size !== indices.length) throw new DomainError('Route stops must have unique order indices');
  }
}
