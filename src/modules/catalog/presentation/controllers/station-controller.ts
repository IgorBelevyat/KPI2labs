import { Request, Response, NextFunction } from 'express';
import { CreateStationCommandHandler } from '../../application/commands/stations/create-station.handler';
import { UpdateStationCommandHandler } from '../../application/commands/stations/update-station.handler';
import { DeleteStationCommandHandler } from '../../application/commands/stations/delete-station.handler';
import { GetStationsQueryHandler } from '../../application/queries/stations/get-stations.handler';

export class StationController {
  constructor(
    private readonly createHandler: CreateStationCommandHandler,
    private readonly updateHandler: UpdateStationCommandHandler,
    private readonly deleteHandler: DeleteStationCommandHandler,
    private readonly getHandler: GetStationsQueryHandler
  ) {}

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getHandler.handle();
      res.json(result);
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.createHandler.handle(req.body);
      res.status(201).json(result);
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.updateHandler.handle({ id: req.params.id as string, ...req.body });
      res.status(204).send();
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.deleteHandler.handle({ id: req.params.id as string });
      res.status(204).send();
    } catch (err) { next(err); }
  };
}
