import { TrainRepository } from '../../domain/repositories/train-repository';

export interface TrainBasicInfo {
  id: string;
  routeId: string;
}

export class CatalogFacade {
  constructor(private readonly trainRepo: TrainRepository) {}

  async getTrainInfo(trainId: string): Promise<TrainBasicInfo | null> {
    const train = await this.trainRepo.findById(trainId);
    if (!train) return null;

    return {
      id: train.id,
      routeId: train.routeId,
    };
  }

  async verifySeatExists(trainId: string, seatId: string): Promise<boolean> {
    const train = await this.trainRepo.findById(trainId);
    if (!train) return false;

    const seat = train.findSeatById(seatId);
    return !!seat;
  }
}
