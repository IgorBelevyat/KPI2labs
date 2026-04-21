import { v4 as uuidv4 } from 'uuid';
import { Train } from '../models/train';
import { TrainNumber } from '../value-objects/train-number';
import { TimeRange } from '../value-objects/time-range';
import { TrainRepository } from '../repositories/train-repository';
import { RouteRepository } from '../repositories/route-repository';
import { NotFoundError, ConflictError } from '../errors/domain-error';

export class TrainFactory {
  constructor(
    private readonly trainRepo: TrainRepository,
    private readonly routeRepo: RouteRepository
  ) { }

  async create(
    numberStr: string,
    routeId: string,
    departureTime: Date,
    arrivalTime: Date
  ): Promise<Train> {
    const trainNumber = new TrainNumber(numberStr);
    const schedule = new TimeRange(departureTime, arrivalTime);

    // train number uniqueness (needs DB)
    const numberExists = await this.trainRepo.existsByNumber(trainNumber.value);
    if (numberExists) {
      throw new ConflictError(`Train with number "${trainNumber.value}" already exists`);
    }

    // route must exist (needs DB)
    const route = await this.routeRepo.findById(routeId);
    if (!route) {
      throw new NotFoundError(`Route ${routeId} not found`);
    }

    return new Train(uuidv4(), trainNumber, routeId, schedule);
  }
}
