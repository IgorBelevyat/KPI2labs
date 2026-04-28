import { CarriageResultDto, SeatResultDto } from '../../dto/train-dto';
import { TrainRepository } from '../../../domain/repositories/train-repository';
import { BookingRepository } from '../../../domain/repositories/booking-repository';
import { NotFoundError } from '../../../domain/errors/domain-error';

export class GetAvailableSeatsUseCase {
  constructor(
    private readonly trainRepo: TrainRepository,
    private readonly bookingRepo: BookingRepository
  ) {}

  async execute(trainId: string, travelDate?: Date): Promise<CarriageResultDto[]> {
    const train = await this.trainRepo.findById(trainId);
    if (!train) throw new NotFoundError(`Train ${trainId} not found`);

    const dateToUse = travelDate || train.schedule.departure;

    const result: CarriageResultDto[] = [];

    for (const carriage of train.carriages) {
      const seatsDto: SeatResultDto[] = [];
      for (const seat of carriage.seats) {
        const isBooked = await this.bookingRepo.isSeatBooked(seat.id, trainId, dateToUse);
        seatsDto.push({
          id: seat.id,
          number: seat.number,
          carriageId: seat.carriageId,
          isBooked,
        });
      }
      result.push({
        id: carriage.id,
        number: carriage.number,
        type: carriage.type,
        seats: seatsDto,
      });
    }

    return result;
  }
}
