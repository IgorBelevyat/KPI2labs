import { PrismaClient } from '@prisma/client';
import { StationReadRepository } from '../../application/interfaces/station-read-repository';
import { StationReadModel } from '../../application/queries/stations/station.read-model';

export class PrismaStationReadRepository implements StationReadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<StationReadModel[]> {
    const rows = await this.prisma.station.findMany({ orderBy: { name: 'asc' } });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      city: r.city,
    }));
  }
}
