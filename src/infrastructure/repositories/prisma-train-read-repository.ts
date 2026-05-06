import { PrismaClient } from '@prisma/client';
import { TrainReadRepository } from '../../application/interfaces/train-read-repository';
import { TrainReadModel, CarriageReadModel } from '../../application/queries/trains/train.read-model';

export class PrismaTrainReadRepository implements TrainReadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<TrainReadModel[]> {
    const rows = await this.prisma.train.findMany({
      include: {
        carriages: {
          include: { seats: true },
          orderBy: { number: 'asc' },
        },
      },
    });

    return rows.map((r) => this.mapTrain(r));
  }

  async searchByRouteAndDate(
    originStationId: string,
    destinationStationId: string,
    date: Date
  ): Promise<TrainReadModel[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const rows = await this.prisma.train.findMany({
      where: {
        route: {
          stops: {
            some: { stationId: originStationId },
          },
        },
        departureTime: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        route: { include: { stops: true } },
        carriages: {
          include: { seats: true },
          orderBy: { number: 'asc' },
        },
      },
    });

    // Filter: origin must come before destination in route stops
    const filtered = rows.filter((t) => {
      const stops = t.route.stops;
      const originIdx = stops.find((s) => s.stationId === originStationId)?.orderIndex ?? -1;
      const destIdx = stops.find((s) => s.stationId === destinationStationId)?.orderIndex ?? -1;
      return originIdx >= 0 && destIdx >= 0 && originIdx < destIdx;
    });

    return filtered.map((r) => this.mapTrain(r));
  }

  async findSeatsAvailability(trainId: string, travelDate?: Date): Promise<CarriageReadModel[]> {
    const train = await this.prisma.train.findUnique({
      where: { id: trainId },
      include: {
        carriages: {
          include: { seats: true },
          orderBy: { number: 'asc' },
        },
      },
    });

    if (!train) return [];

    const dateToUse = travelDate || train.departureTime;

    // Get all booked seat IDs for this train and date
    const bookings = await this.prisma.booking.findMany({
      where: {
        trainId,
        travelDate: dateToUse,
        status: { not: 'CANCELLED' },
      },
      select: { seatId: true },
    });
    const bookedSeatIds = new Set(bookings.map((b) => b.seatId));

    return train.carriages.map((c) => ({
      id: c.id,
      number: c.number,
      type: c.type,
      seats: c.seats.map((s) => ({
        id: s.id,
        number: s.number,
        carriageId: s.carriageId,
        isBooked: bookedSeatIds.has(s.id),
      })),
    }));
  }

  private mapTrain(r: any): TrainReadModel {
    return {
      id: r.id,
      number: r.number,
      routeId: r.routeId,
      departureTime: r.departureTime.toISOString(),
      arrivalTime: r.arrivalTime.toISOString(),
      carriages: r.carriages.map((c: any) => ({
        id: c.id,
        number: c.number,
        type: c.type,
        seats: c.seats.map((s: any) => ({
          id: s.id,
          number: s.number,
          carriageId: s.carriageId,
          isBooked: false,
        })),
      })),
    };
  }
}
