import { Route, RouteStop } from '../../../../src/domain/models/route';
import { DomainError } from '../../../../src/domain/errors/domain-error';

describe('Route Aggregate', () => {
  it('should create a valid route with 2+ stops', () => {
    const stops = [
      new RouteStop('station-a', 0),
      new RouteStop('station-b', 1),
    ];
    const route = new Route('route-1', stops);
    expect(route.id).toBe('route-1');
    expect(route.stops).toHaveLength(2);
    expect(route.originStationId).toBe('station-a');
    expect(route.destinationStationId).toBe('station-b');
  });

  it('should sort stops by orderIndex', () => {
    const stops = [
      new RouteStop('station-b', 2),
      new RouteStop('station-a', 0),
      new RouteStop('station-c', 1),
    ];
    const route = new Route('route-1', stops);
    expect(route.stops[0].stationId).toBe('station-a');
    expect(route.stops[1].stationId).toBe('station-c');
    expect(route.stops[2].stationId).toBe('station-b');
  });

  it('should throw if less than 2 stops', () => {
    const stops = [new RouteStop('station-a', 0)];
    expect(() => new Route('route-1', stops)).toThrow(DomainError);
  });

  it('should throw if origin equals destination', () => {
    const stops = [
      new RouteStop('station-a', 0),
      new RouteStop('station-a', 1),
    ];
    expect(() => new Route('route-1', stops)).toThrow(DomainError);
  });

  it('should throw if duplicate order indices', () => {
    const stops = [
      new RouteStop('station-a', 0),
      new RouteStop('station-b', 0),
    ];
    expect(() => new Route('route-1', stops)).toThrow(DomainError);
  });

  it('should check if route contains a station', () => {
    const stops = [
      new RouteStop('station-a', 0),
      new RouteStop('station-b', 1),
      new RouteStop('station-c', 2),
    ];
    const route = new Route('route-1', stops);
    expect(route.containsStation('station-b')).toBe(true);
    expect(route.containsStation('station-x')).toBe(false);
  });

  it('should update stops', () => {
    const route = new Route('route-1', [
      new RouteStop('station-a', 0),
      new RouteStop('station-b', 1),
    ]);
    route.updateStops([
      new RouteStop('station-x', 0),
      new RouteStop('station-y', 1),
      new RouteStop('station-z', 2),
    ]);
    expect(route.stops).toHaveLength(3);
  });
});
