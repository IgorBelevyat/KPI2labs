import { TrainResultDto } from '../../dto/train-dto';
import { TrainRepository } from '../../../domain/repositories/train-repository';

export class SearchTrainsUseCase {
  constructor(private readonly trainRepo: TrainRepository) {}

  async execute(originStationId: string, destinationStationId: string, date: Date): Promise<TrainResultDto[]> {
    const trains = await this.trainRepo.findByRouteAndDate(originStationId, destinationStationId, date);
    return trains.map((t) => ({
      id: t.id,
      number: t.number.value,
      routeId: t.routeId,
      departureTime: t.schedule.departure.toISOString(),
      arrivalTime: t.schedule.arrival.toISOString(),
      carriages: t.carriages.map((c) => ({
        id: c.id,
        number: c.number,
        type: c.type,
        seats: c.seats.map((s) => ({ id: s.id, number: s.number, carriageId: s.carriageId, isBooked: false })),
      })),
    }));
  }
}
