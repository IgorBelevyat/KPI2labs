export interface RouteStopReadModel {
  stationId: string;
  stationName: string;
  orderIndex: number;
}

export interface RouteReadModel {
  id: string;
  stops: RouteStopReadModel[];
}
