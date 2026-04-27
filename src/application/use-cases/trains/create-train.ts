import { CreateTrainDto, TrainResultDto } from '../../dto/train-dto';
import { TrainFactory } from '../../../domain/factories/train-factory';
import { TrainRepository } from '../../../domain/repositories/train-repository';

export class CreateTrainUseCase {
  constructor(
    private readonly trainFactory: TrainFactory,
    private readonly trainRepo: TrainRepository
  ) {}

  async execute(dto: CreateTrainDto): Promise<TrainResultDto> {
    const train = await this.trainFactory.create(
      dto.number,
      dto.routeId,
      new Date(dto.departureTime),
      new Date(dto.arrivalTime)
    );
    await this.trainRepo.save(train);

    return {
      id: train.id,
      number: train.number.value,
      routeId: train.routeId,
      departureTime: train.schedule.departure.toISOString(),
      arrivalTime: train.schedule.arrival.toISOString(),
      carriages: [],
    };
  }
}
