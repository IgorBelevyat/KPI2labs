import { AnalyticsReadRepository, DailyStatReadModel } from '../interfaces/analytics-read-repository';

export class GetStatsQueryHandler {
  constructor(private readonly readRepo: AnalyticsReadRepository) {}

  async handle(): Promise<DailyStatReadModel[]> {
    return await this.readRepo.getAllStats();
  }
}
