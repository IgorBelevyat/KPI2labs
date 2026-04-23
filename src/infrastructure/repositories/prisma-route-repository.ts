import { PrismaClient } from '@prisma/client';
import { Route } from '../../domain/models/route';
import { RouteRepository } from '../../domain/repositories/route-repository';
import { RouteMapper } from '../mappers/route-mapper';

export class PrismaRouteRepository implements RouteRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async save(route: Route): Promise<void> {
    const data = RouteMapper.toPersistence(route);

    await this.prisma.$transaction(async (tx) => {
      await tx.route.upsert({
        where: { id: data.id },
        update: {},
        create: { id: data.id },
      });

      await tx.routeStop.deleteMany({ where: { routeId: data.id } });
      await tx.routeStop.createMany({
        data: data.stops.map((s) => ({
          routeId: data.id,
          stationId: s.stationId,
          orderIndex: s.orderIndex,
        })),
      });
    });
  }

  async findById(id: string): Promise<Route | null> {
    const raw = await this.prisma.route.findUnique({
      where: { id },
      include: { stops: { orderBy: { orderIndex: 'asc' } } },
    });
    return raw ? RouteMapper.toDomain(raw) : null;
  }

  async findAll(): Promise<Route[]> {
    const rows = await this.prisma.route.findMany({
      include: { stops: { orderBy: { orderIndex: 'asc' } } },
    });
    return rows.map(RouteMapper.toDomain);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.route.delete({ where: { id } });
  }

  async isUsedByTrains(id: string): Promise<boolean> {
    const count = await this.prisma.train.count({ where: { routeId: id } });
    return count > 0;
  }
}
