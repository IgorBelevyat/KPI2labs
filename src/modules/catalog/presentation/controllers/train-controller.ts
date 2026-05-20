import { Request, Response, NextFunction } from 'express';
import { CreateTrainCommandHandler } from '../../application/commands/trains/create-train.handler';
import { UpdateTrainCommandHandler } from '../../application/commands/trains/update-train.handler';
import { DeleteTrainCommandHandler } from '../../application/commands/trains/delete-train.handler';
import { AddCarriageCommandHandler } from '../../application/commands/trains/add-carriage.handler';
import { GetAllTrainsQueryHandler } from '../../application/queries/trains/get-all-trains.handler';
import { SearchTrainsQueryHandler } from '../../application/queries/trains/search-trains.handler';
import { GetAvailableSeatsQueryHandler } from '../../application/queries/trains/get-available-seats.handler';

export class TrainController {
  constructor(
    private readonly createHandler: CreateTrainCommandHandler,
    private readonly updateHandler: UpdateTrainCommandHandler,
    private readonly deleteHandler: DeleteTrainCommandHandler,
    private readonly addCarriageHandler: AddCarriageCommandHandler,
    private readonly getAllHandler: GetAllTrainsQueryHandler,
    private readonly searchHandler: SearchTrainsQueryHandler,
    private readonly getSeatsHandler: GetAvailableSeatsQueryHandler
  ) {}

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getAllHandler.handle();
      res.json(result);
    } catch (err) { next(err); }
  };

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.searchHandler.handle({
        originStationId: req.query.origin as string,
        destinationStationId: req.query.destination as string,
        date: req.query.date as string,
      });
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

  addCarriage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.addCarriageHandler.handle({ trainId: req.params.id as string, ...req.body });
      res.status(201).json(result);
    } catch (err) { next(err); }
  };

  getAvailableSeats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getSeatsHandler.handle({
        trainId: req.params.id as string,
        travelDate: req.query.date as string | undefined,
      });
      res.json(result);
    } catch (err) { next(err); }
  };
}
