import { Request, Response, NextFunction } from 'express';
import { CreateRouteCommandHandler } from '../../application/commands/routes/create-route.handler';
import { UpdateRouteCommandHandler } from '../../application/commands/routes/update-route.handler';
import { DeleteRouteCommandHandler } from '../../application/commands/routes/delete-route.handler';
import { GetRoutesQueryHandler } from '../../application/queries/routes/get-routes.handler';

export class RouteController {
  constructor(
    private readonly createHandler: CreateRouteCommandHandler,
    private readonly updateHandler: UpdateRouteCommandHandler,
    private readonly deleteHandler: DeleteRouteCommandHandler,
    private readonly getHandler: GetRoutesQueryHandler
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
