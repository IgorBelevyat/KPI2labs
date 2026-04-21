import { v4 as uuidv4 } from 'uuid';
import { Booking } from '../models/booking';
import { BookingRepository } from '../repositories/booking-repository';
import { TrainRepository } from '../repositories/train-repository';
import { NotFoundError, ConflictError, DomainError } from '../errors/domain-error';

export class BookingFactory {
  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly trainRepo: TrainRepository
  ) { }

  async create(
    userId: string,
    trainId: string,
    seatId: string,
    travelDate: Date
  ): Promise<Booking> {
    // travel date cannot be in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (travelDate < today) {
      throw new DomainError('Travel date cannot be in the past');
    }

    //train must exist and seat must belong to it (needs DB)
    const train = await this.trainRepo.findById(trainId);
    if (!train) {
      throw new NotFoundError(`Train ${trainId} not found`);
    }

    const seat = train.findSeatById(seatId);
    if (!seat) {
      throw new NotFoundError(`Seat ${seatId} not found in train ${trainId}`);
    }

    //seat not already booked for this date (needs DB)
    const isBooked = await this.bookingRepo.isSeatBooked(seatId, trainId, travelDate);
    if (isBooked) {
      throw new ConflictError('This seat is already booked for the selected date');
    }

    return new Booking(uuidv4(), userId, trainId, seatId, travelDate);
  }
}
