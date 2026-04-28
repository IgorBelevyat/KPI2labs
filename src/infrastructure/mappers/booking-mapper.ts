import { Booking as PrismaBooking } from '@prisma/client';
import { Booking, BookingStatus } from '../../domain/models/booking';

export class BookingMapper {
  static toDomain(raw: PrismaBooking): Booking {
    return new Booking(
      raw.id,
      raw.userId,
      raw.trainId,
      raw.seatId,
      raw.travelDate,
      raw.status as BookingStatus,
      raw.createdAt
    );
  }

  static toPersistence(booking: Booking) {
    return {
      id: booking.id,
      userId: booking.userId,
      trainId: booking.trainId,
      seatId: booking.seatId,
      travelDate: booking.travelDate,
      status: booking.status,
    };
  }
}

