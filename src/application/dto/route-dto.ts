export interface RouteStopInput {
  stationId: string;
  orderIndex: number;
}

export interface CreateRouteDto {
  stops: RouteStopInput[];
}

export interface UpdateRouteDto {
  stops: RouteStopInput[];
}

export interface RouteStopResultDto {
  stationId: string;
  orderIndex: number;
}

export interface RouteResultDto {
  id: string;
  stops: RouteStopResultDto[];
}
