import { v4 as uuidv4 } from 'uuid';
import { IntegrationEvent } from '../../../../domain/events/integration-events';
import { AnalyticsRepository } from '../../domain/repositories/analytics-repository';
import { DailyStat } from '../../domain/models/daily-stat';

export class AnalyticsSubscriber {
  constructor(private readonly analyticsRepo: AnalyticsRepository) { }

  async handleEvent(event: IntegrationEvent): Promise<void> {
    switch (event.type) {
      case 'BookingCreated':
        await this.onBookingCreated(event);
        break;
      case 'BookingCancelled':
        await this.onBookingCancelled(event);
        break;
      default:
        break;
    }
  }

  private async onBookingCreated(event: any): Promise<void> {
    console.log(`[Analytics ACL] Translating BookingCreated event: ${event.bookingId}`);
    const date = new Date(event.occurredAt);

    let stat = await this.analyticsRepo.findByDate(date);
    if (!stat) {
      stat = new DailyStat(uuidv4(), date, 0, 0);
    }

    stat.incrementTickets(1);
    await this.analyticsRepo.save(stat);
  }

  private async onBookingCancelled(event: any): Promise<void> {
    console.log(`[Analytics ACL] Translating BookingCancelled event: ${event.bookingId}`);

    const date = new Date(event.occurredAt);

    let stat = await this.analyticsRepo.findByDate(date);
    if (!stat) {
      stat = new DailyStat(uuidv4(), date, 0, 0);
    }

    stat.decrementTickets(1);
    await this.analyticsRepo.save(stat);
  }
}
