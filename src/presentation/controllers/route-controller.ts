import { Request, Response, NextFunction } from 'express';
import { CreateRouteUseCase } from '../../application/use-cases/routes/create-route';
import { UpdateRouteUseCase } from '../../application/use-cases/routes/update-route';
import { DeleteRouteUseCase } from '../../application/use-cases/routes/delete-route';
import { GetRoutesUseCase } from '../../application/use-cases/routes/get-routes';

export class RouteController {
  constructor(
    private readonly createUC: CreateRouteUseCase,
    private readonly updateUC: UpdateRouteUseCase,
    private readonly deleteUC: DeleteRouteUseCase,
    private readonly getUC: GetRoutesUseCase
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
