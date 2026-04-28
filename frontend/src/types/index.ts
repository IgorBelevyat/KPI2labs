export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  errors: string[];
}

export interface Station {
  id: string;
  name: string;
  city: string;
}

export interface RouteStop {
  stationId: string;
  orderIndex: number;
}

export interface Route {
  id: string;
  stops: RouteStop[];
}

export interface Train {
  id: string;
  number: string;
  routeId: string;
  departureTime: string;
  arrivalTime: string;
}

export interface Seat {
  id: string;
  carriageId: string;
  number: number;
  isBooked: boolean;
}

export interface Carriage {
  id: string;
  trainId: string;
  number: number;
  type: string;
  seats: Seat[];
}

export interface Booking {
  id: string;
  userId: string;
  trainId: string;
  seatId: string;
  status: 'created' | 'cancelled';
  createdAt: string;
  train?: Train;
  seat?: Seat;
}

