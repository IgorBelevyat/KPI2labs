import { PrismaClient } from '@prisma/client';
import { Booking } from '../../domain/models/booking';
import { BookingRepository } from '../../domain/repositories/booking-repository';
import { BookingMapper } from '../mappers/booking-mapper';

export class PrismaBookingRepository implements BookingRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async save(booking: Booking): Promise<void> {
    const data = BookingMapper.toPersistence(booking);

    await this.prisma.$transaction(async (tx) => {
      await tx.booking.deleteMany({
        where: {
          seatId: data.seatId,
          trainId: data.trainId,
          travelDate: data.travelDate,
          status: 'cancelled',
        },
      });

      await tx.booking.upsert({
        where: { id: data.id },
        update: { status: data.status },
        create: data,
      });
    });
  }

  async findById(id: string): Promise<Booking | null> {
    const raw = await this.prisma.booking.findUnique({ where: { id } });
    return raw ? BookingMapper.toDomain(raw) : null;
  }

  async findByUserId(userId: string): Promise<Booking[]> {
    const rows = await this.prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => BookingMapper.toDomain(r));
  }

  async isSeatBooked(seatId: string, trainId: string, travelDate: Date): Promise<boolean> {
    const count = await this.prisma.booking.count({
      where: {
        seatId,
        trainId,
        travelDate,
        status: 'created',
      },
    });
    return count > 0;
  }

  async findActiveByTrainId(trainId: string): Promise<Booking[]> {
    const rows = await this.prisma.booking.findMany({
      where: { trainId, status: 'created' },
    });
    return rows.map((r) => BookingMapper.toDomain(r));
  }
}
