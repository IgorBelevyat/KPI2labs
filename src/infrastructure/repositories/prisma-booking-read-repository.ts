import { PrismaClient } from '@prisma/client';
import { BookingReadRepository } from '../../application/interfaces/booking-read-repository';
import { BookingResultDto } from '../../application/dto/booking-dto';

export class PrismaBookingReadRepository implements BookingReadRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async findUserBookingsWithDetails(userId: string): Promise<BookingResultDto[]> {
    const rows = await this.prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        train: true,
        seat: true,
      },
    });

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      trainId: r.trainId,
      seatId: r.seatId,
      travelDate: r.travelDate.toISOString(),
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      train: r.train ? {
        number: r.train.number,
        departureTime: r.train.departureTime.toISOString(),
        arrivalTime: r.train.arrivalTime.toISOString(),
      } : undefined,
      seat: r.seat ? {
        number: r.seat.number,
      } : undefined,
    }));
  }
}
