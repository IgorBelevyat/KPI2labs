import { Route as PrismaRoute, RouteStop as PrismaRouteStop } from '@prisma/client';
import { Route, RouteStop } from '../../domain/models/route';

type PrismaRouteWithStops = PrismaRoute & {
  stops: PrismaRouteStop[];
};

export class RouteMapper {
  static toDomain(raw: PrismaRouteWithStops): Route {
    const stops = raw.stops.map(
      (s) => new RouteStop(s.stationId, s.orderIndex)
    );
    return new Route(raw.id, stops);
  }

  static toPersistence(route: Route) {
    return {
      id: route.id,
      stops: route.stops.map((s) => ({
        stationId: s.stationId,
        orderIndex: s.orderIndex,
      })),
    };
  }
}
