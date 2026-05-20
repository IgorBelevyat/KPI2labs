import { CatalogService, TrainInfo } from '../../domain/repositories/catalog-service.interface';
import { CatalogFacade } from '../../../catalog';

export class CatalogAdapter implements CatalogService {
  constructor(private readonly catalogFacade: CatalogFacade) { }

  async getTrainInfo(trainId: string): Promise<TrainInfo | null> {
    const trainInfo = await this.catalogFacade.getTrainInfo(trainId);
    if (!trainInfo) return null;

    return {
      id: trainInfo.id,
      routeId: trainInfo.routeId,
    };
  }

  async verifySeatExists(trainId: string, seatId: string): Promise<boolean> {
    return await this.catalogFacade.verifySeatExists(trainId, seatId);
  }
}
