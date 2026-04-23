import { PrismaClient } from '@prisma/client';
import { Train } from '../../domain/models/train';
import { TrainRepository } from '../../domain/repositories/train-repository';
import { TrainMapper } from '../mappers/train-mapper';

const INCLUDE_CARRIAGES = {
  carriages: {
    include: { seats: true },
    orderBy: { number: 'asc' as const },
  },
};

export class PrismaTrainRepository implements TrainRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async save(train: Train): Promise<void> {
    const data = TrainMapper.toPersistence(train);

    await this.prisma.$transaction(async (tx) => {
      await tx.train.upsert({
        where: { id: data.id },
        update: {
          number: data.number,
          routeId: data.routeId,
          departureTime: data.departureTime,
          arrivalTime: data.arrivalTime,
        },
        create: data,
      });

      for (const carriage of train.carriages) {
        await tx.carriage.upsert({
          where: { id: carriage.id },
          update: { number: carriage.number, type: carriage.type },
          create: {
            id: carriage.id,
            number: carriage.number,
            type: carriage.type,
            trainId: train.id,
          },
        });

        for (const seat of carriage.seats) {
          await tx.seat.upsert({
            where: { id: seat.id },
            update: { number: seat.number },
            create: {
              id: seat.id,
              number: seat.number,
              carriageId: carriage.id,
            },
          });
        }
      }
    });
  }

  async findById(id: string): Promise<Train | null> {
    const raw = await this.prisma.train.findUnique({
      where: { id },
      include: INCLUDE_CARRIAGES,
    });
    return raw ? TrainMapper.toDomain(raw) : null;
  }

  async findByNumber(number: string): Promise<Train | null> {
    const raw = await this.prisma.train.findUnique({
      where: { number },
      include: INCLUDE_CARRIAGES,
    });
    return raw ? TrainMapper.toDomain(raw) : null;
  }

  async findByRouteAndDate(
    originStationId: string,
    destinationStationId: string,
    _date: Date
  ): Promise<Train[]> {
    const rows = await this.prisma.train.findMany({
      where: {
        route: {
          stops: {
            some: { stationId: originStationId },
          },
          AND: {
            stops: {
              some: { stationId: destinationStationId },
            },
          },
        },
      },
      include: INCLUDE_CARRIAGES,
    });
    return rows.map(TrainMapper.toDomain);
  }

  async findAll(): Promise<Train[]> {
    const rows = await this.prisma.train.findMany({
      include: INCLUDE_CARRIAGES,
      orderBy: { number: 'asc' },
    });
    return rows.map(TrainMapper.toDomain);
  }

  async existsByNumber(number: string): Promise<boolean> {
    const count = await this.prisma.train.count({ where: { number } });
    return count > 0;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.train.delete({ where: { id } });
  }

  async hasActiveBookings(id: string): Promise<boolean> {
    const count = await this.prisma.booking.count({
      where: { trainId: id, status: 'created' },
    });
    return count > 0;
  }
}
