import { TrainReadModel } from './train.read-model';
import { TrainReadRepository } from '../../interfaces/train-read-repository';

export class GetAllTrainsQueryHandler {
  constructor(private readonly readRepo: TrainReadRepository) {}

  async handle(): Promise<TrainReadModel[]> {
    return this.readRepo.findAll();
  }
}
