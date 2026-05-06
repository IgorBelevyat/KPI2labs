import { PrismaClient } from '@prisma/client';
import { RouteReadRepository } from '../../application/interfaces/route-read-repository';
import { RouteReadModel } from '../../application/queries/routes/route.read-model';

export class PrismaRouteReadRepository implements RouteReadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<RouteReadModel[]> {
    const rows = await this.prisma.route.findMany({
      include: {
        stops: {
          include: { station: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      stops: r.stops.map((s) => ({
        stationId: s.stationId,
        stationName: s.station.name,
        orderIndex: s.orderIndex,
      })),
    }));
  }
}
