export interface DailyStatReadModel {
  id: string;
  date: string;
  ticketsSold: number;
  revenue: number;
}

export interface AnalyticsReadRepository {
  getAllStats(): Promise<DailyStatReadModel[]>;
}
