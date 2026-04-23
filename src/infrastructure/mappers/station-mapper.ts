import { Station as PrismaStation } from '@prisma/client';
import { Station } from '../../domain/models/station';

export class StationMapper {
  static toDomain(raw: PrismaStation): Station {
    return new Station(raw.id, raw.name, raw.city);
  }

  static toPersistence(station: Station) {
    return {
      id: station.id,
      name: station.name,
      city: station.city,
    };
  }
}
