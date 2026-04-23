import { PrismaClient } from '@prisma/client';
import { Station } from '../../domain/models/station';
import { StationRepository } from '../../domain/repositories/station-repository';
import { StationMapper } from '../mappers/station-mapper';

export class PrismaStationRepository implements StationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(station: Station): Promise<void> {
    const data = StationMapper.toPersistence(station);
    await this.prisma.station.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
  }

  async findById(id: string): Promise<Station | null> {
    const raw = await this.prisma.station.findUnique({ where: { id } });
    return raw ? StationMapper.toDomain(raw) : null;
  }

  async findByName(name: string): Promise<Station | null> {
    const raw = await this.prisma.station.findUnique({ where: { name } });
    return raw ? StationMapper.toDomain(raw) : null;
  }

  async findAll(): Promise<Station[]> {
    const rows = await this.prisma.station.findMany({ orderBy: { name: 'asc' } });
    return rows.map(StationMapper.toDomain);
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.prisma.station.count({ where: { name } });
    return count > 0;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.station.delete({ where: { id } });
  }

  async isUsedInRoutes(id: string): Promise<boolean> {
    const count = await this.prisma.routeStop.count({ where: { stationId: id } });
    return count > 0;
  }
}
