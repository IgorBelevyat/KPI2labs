import { PrismaClient } from '@prisma/client';
import { AnalyticsReadRepository, DailyStatReadModel } from '../../application/interfaces/analytics-read-repository';

export class PrismaAnalyticsReadRepository implements AnalyticsReadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getAllStats(): Promise<DailyStatReadModel[]> {
    const records = await this.prisma.analyticsDailyStat.findMany({
      orderBy: { date: 'desc' }
    });

    return records.map(r => ({
      id: r.id,
      date: r.date.toISOString().split('T')[0],
      ticketsSold: r.ticketsSold,
      revenue: r.revenue
    }));
  }
}
