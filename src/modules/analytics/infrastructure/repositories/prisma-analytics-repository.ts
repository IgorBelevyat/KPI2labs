import { PrismaClient } from '@prisma/client';
import { AnalyticsRepository } from '../../domain/repositories/analytics-repository';
import { DailyStat } from '../../domain/models/daily-stat';

export class PrismaAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private normalizeDate(d: Date): Date {
    const date = new Date(d);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

  async findByDate(date: Date): Promise<DailyStat | null> {
    const record = await this.prisma.analyticsDailyStat.findUnique({
      where: { date: this.normalizeDate(date) }
    });

    if (!record) return null;
    return new DailyStat(record.id, record.date, record.ticketsSold, record.revenue);
  }

  async save(stat: DailyStat): Promise<void> {
    await this.prisma.analyticsDailyStat.upsert({
      where: { date: this.normalizeDate(stat.date) },
      update: {
        ticketsSold: stat.ticketsSold,
        revenue: stat.revenue
      },
      create: {
        id: stat.id,
        date: this.normalizeDate(stat.date),
        ticketsSold: stat.ticketsSold,
        revenue: stat.revenue
      }
    });
  }

}
