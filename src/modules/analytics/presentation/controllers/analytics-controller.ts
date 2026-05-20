import { Request, Response, NextFunction } from 'express';
import { GetStatsQueryHandler } from '../../application/queries/get-stats.handler';

export class AnalyticsController {
  constructor(private readonly getStatsHandler: GetStatsQueryHandler) {}

  getAllStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.getStatsHandler.handle();
      res.status(200).json(stats);
    } catch (err) {
      next(err);
    }
  };
}
