import { DailyStat } from '../models/daily-stat';

export interface AnalyticsRepository {
  findByDate(date: Date): Promise<DailyStat | null>;
  save(stat: DailyStat): Promise<void>;
}
