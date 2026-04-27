import { CreateBookingDto, BookingResultDto } from '../../dto/booking-dto';
import { BookingFactory } from '../../../domain/factories/booking-factory';
import { BookingRepository } from '../../../domain/repositories/booking-repository';

export class CreateBookingUseCase {
  constructor(
    private readonly bookingFactory: BookingFactory,
    private readonly bookingRepo: BookingRepository
  ) {}

  async execute(userId: string, dto: CreateBookingDto): Promise<BookingResultDto> {
    const booking = await this.bookingFactory.create(
      userId,
      dto.trainId,
      dto.seatId,
      new Date(dto.travelDate)
    );
    await this.bookingRepo.save(booking);

    return {
      id: booking.id,
      userId: booking.userId,
      trainId: booking.trainId,
      seatId: booking.seatId,
      travelDate: booking.travelDate.toISOString(),
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
    };
  }
}
