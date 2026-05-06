export interface RouteStopInput {
  stationId: string;
  orderIndex: number;
}

export interface CreateRouteCommand {
  stops: RouteStopInput[];
}
