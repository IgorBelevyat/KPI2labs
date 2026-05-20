import { RouteStopInput } from './create-route.command';

export interface UpdateRouteCommand {
  id: string;
  stops: RouteStopInput[];
}
