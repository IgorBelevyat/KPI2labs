import { BookingResultDto } from '../../dto/booking-dto';
import { BookingReadRepository } from '../../interfaces/booking-read-repository';

export class GetUserBookingsUseCase {
  constructor(private readonly bookingReadRepo: BookingReadRepository) {}

  async execute(userId: string): Promise<BookingResultDto[]> {
    return this.bookingReadRepo.findUserBookingsWithDetails(userId);
  }
}

