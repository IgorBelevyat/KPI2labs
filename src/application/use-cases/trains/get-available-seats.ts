import { SeatResultDto } from '../../dto/train-dto';
import { TrainRepository } from '../../../domain/repositories/train-repository';
import { BookingRepository } from '../../../domain/repositories/booking-repository';
import { NotFoundError } from '../../../domain/errors/domain-error';

export class GetAvailableSeatsUseCase {
  constructor(
    private readonly trainRepo: TrainRepository,
    private readonly bookingRepo: BookingRepository
  ) {}

  async execute(trainId: string, travelDate: Date): Promise<SeatResultDto[]> {
    const train = await this.trainRepo.findById(trainId);
    if (!train) throw new NotFoundError(`Train ${trainId} not found`);

    const result: SeatResultDto[] = [];

    for (const carriage of train.carriages) {
      for (const seat of carriage.seats) {
        const isBooked = await this.bookingRepo.isSeatBooked(seat.id, trainId, travelDate);
        result.push({
          id: seat.id,
          number: seat.number,
          carriageId: seat.carriageId,
          isBooked,
        });
      }
    }

    return result;
  }
}
