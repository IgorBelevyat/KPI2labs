import { UpdateTrainDto, TrainResultDto } from '../../dto/train-dto';
import { TrainRepository } from '../../../domain/repositories/train-repository';
import { RouteRepository } from '../../../domain/repositories/route-repository';
import { TrainNumber } from '../../../domain/value-objects/train-number';
import { TimeRange } from '../../../domain/value-objects/time-range';
import { NotFoundError } from '../../../domain/errors/domain-error';

export class UpdateTrainUseCase {
  constructor(
    private readonly trainRepo: TrainRepository,
    private readonly routeRepo: RouteRepository
  ) {}

  async execute(id: string, dto: UpdateTrainDto): Promise<TrainResultDto> {
    const train = await this.trainRepo.findById(id);
    if (!train) throw new NotFoundError(`Train ${id} not found`);

    const route = await this.routeRepo.findById(dto.routeId);
    if (!route) throw new NotFoundError(`Route ${dto.routeId} not found`);

    train.updateDetails(
      new TrainNumber(dto.number),
      dto.routeId,
      new TimeRange(new Date(dto.departureTime), new Date(dto.arrivalTime))
    );
    await this.trainRepo.save(train);

    return {
      id: train.id,
      number: train.number.value,
      routeId: train.routeId,
      departureTime: train.schedule.departure.toISOString(),
      arrivalTime: train.schedule.arrival.toISOString(),
      carriages: train.carriages.map((c) => ({
        id: c.id,
        number: c.number,
        type: c.type,
        seats: c.seats.map((s) => ({ id: s.id, number: s.number, carriageId: s.carriageId, isBooked: false })),
      })),
    };
  }
}
