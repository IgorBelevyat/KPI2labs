export class DailyStat {
  constructor(
    public readonly id: string,
    public readonly date: Date,
    public ticketsSold: number,
    public revenue: number
  ) {}

  incrementTickets(count: number = 1) {
    this.ticketsSold += count;
  }

  decrementTickets(count: number = 1) {
    this.ticketsSold = Math.max(0, this.ticketsSold - count);
  }
}
