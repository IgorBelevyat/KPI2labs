import {
  Train as PrismaTrain,
  Carriage as PrismaCarriage,
  Seat as PrismaSeat,
} from '@prisma/client';
import { Train, Carriage, Seat, CarriageType } from '../../domain/models/train';
import { TrainNumber } from '../../domain/value-objects/train-number';
import { TimeRange } from '../../domain/value-objects/time-range';

type PrismaTrainWithCarriages = PrismaTrain & {
  carriages: (PrismaCarriage & { seats: PrismaSeat[] })[];
};

export class TrainMapper {
  static toDomain(raw: PrismaTrainWithCarriages): Train {
    const carriages = raw.carriages.map((c) => {
      const seats = c.seats.map((s) => new Seat(s.id, s.number, s.carriageId));
      return new Carriage(c.id, c.number, c.type as CarriageType, c.trainId, seats);
    });

    return new Train(
      raw.id,
      new TrainNumber(raw.number),
      raw.routeId,
      new TimeRange(raw.departureTime, raw.arrivalTime),
      carriages
    );
  }

  static toPersistence(train: Train) {
    return {
      id: train.id,
      number: train.number.value,
      routeId: train.routeId,
      departureTime: train.schedule.departure,
      arrivalTime: train.schedule.arrival,
    };
  }
}
