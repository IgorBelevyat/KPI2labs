import { Request, Response, NextFunction } from 'express';
import { CreateStationUseCase } from '../../application/use-cases/stations/create-station';
import { UpdateStationUseCase } from '../../application/use-cases/stations/update-station';
import { DeleteStationUseCase } from '../../application/use-cases/stations/delete-station';
import { GetStationsUseCase } from '../../application/use-cases/stations/get-stations';

export class StationController {
  constructor(
    private readonly createUC: CreateStationUseCase,
    private readonly updateUC: UpdateStationUseCase,
    private readonly deleteUC: DeleteStationUseCase,
    private readonly getUC: GetStationsUseCase
  ) {}

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getUC.execute();
      res.json(result);
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.createUC.execute(req.body);
      res.status(201).json(result);
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.updateUC.execute((req.params.id as string), req.body);
      res.json(result);
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.deleteUC.execute((req.params.id as string));
      res.status(204).send();
    } catch (err) { next(err); }
  };
}
