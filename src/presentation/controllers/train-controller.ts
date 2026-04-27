import { Request, Response, NextFunction } from 'express';
import { CreateTrainUseCase } from '../../application/use-cases/trains/create-train';
import { UpdateTrainUseCase } from '../../application/use-cases/trains/update-train';
import { DeleteTrainUseCase } from '../../application/use-cases/trains/delete-train';
import { SearchTrainsUseCase } from '../../application/use-cases/trains/search-trains';
import { AddCarriageUseCase } from '../../application/use-cases/trains/add-carriage';
import { GetAvailableSeatsUseCase } from '../../application/use-cases/trains/get-available-seats';

export class TrainController {
  constructor(
    private readonly createUC: CreateTrainUseCase,
    private readonly updateUC: UpdateTrainUseCase,
    private readonly deleteUC: DeleteTrainUseCase,
    private readonly searchUC: SearchTrainsUseCase,
    private readonly addCarriageUC: AddCarriageUseCase,
    private readonly getSeatsUC: GetAvailableSeatsUseCase
  ) {}

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { origin, destination, date } = req.query;
      const result = await this.searchUC.execute(
        origin as string,
        destination as string,
        new Date(date as string)
      );
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

  addCarriage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.addCarriageUC.execute((req.params.id as string), req.body);
      res.status(201).json(result);
    } catch (err) { next(err); }
  };

  getAvailableSeats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { date } = req.query;
      const result = await this.getSeatsUC.execute((req.params.id as string), new Date(date as string));
      res.json(result);
    } catch (err) { next(err); }
  };
}
