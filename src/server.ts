import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import prisma from './infrastructure/database/prisma-client';

import { PrismaUserRepository } from './infrastructure/repositories/prisma-user-repository';
import { PrismaStationRepository } from './infrastructure/repositories/prisma-station-repository';
import { PrismaRouteRepository } from './infrastructure/repositories/prisma-route-repository';
import { PrismaTrainRepository } from './infrastructure/repositories/prisma-train-repository';
import { PrismaBookingRepository } from './infrastructure/repositories/prisma-booking-repository';
import { PrismaBookingReadRepository } from './infrastructure/repositories/prisma-booking-read-repository';

import { BcryptPasswordHasher } from './infrastructure/auth/bcrypt-password-hasher';
import { JwtTokenService } from './infrastructure/auth/jwt-token-service';

import { UserFactory } from './domain/factories/user-factory';
import { StationFactory } from './domain/factories/station-factory';
import { RouteFactory } from './domain/factories/route-factory';
import { TrainFactory } from './domain/factories/train-factory';
import { BookingFactory } from './domain/factories/booking-factory';

import { RegisterUserUseCase } from './application/use-cases/auth/register-user';
import { LoginUserUseCase } from './application/use-cases/auth/login-user';
import { RefreshTokenUseCase } from './application/use-cases/auth/refresh-token';
import { CreateStationUseCase } from './application/use-cases/stations/create-station';
import { UpdateStationUseCase } from './application/use-cases/stations/update-station';
import { DeleteStationUseCase } from './application/use-cases/stations/delete-station';
import { GetStationsUseCase } from './application/use-cases/stations/get-stations';
import { CreateRouteUseCase } from './application/use-cases/routes/create-route';
import { UpdateRouteUseCase } from './application/use-cases/routes/update-route';
import { DeleteRouteUseCase } from './application/use-cases/routes/delete-route';
import { GetRoutesUseCase } from './application/use-cases/routes/get-routes';
import { CreateTrainUseCase } from './application/use-cases/trains/create-train';
import { UpdateTrainUseCase } from './application/use-cases/trains/update-train';
import { DeleteTrainUseCase } from './application/use-cases/trains/delete-train';
import { SearchTrainsUseCase } from './application/use-cases/trains/search-trains';
import { GetAllTrainsUseCase } from './application/use-cases/trains/get-all-trains';
import { AddCarriageUseCase } from './application/use-cases/trains/add-carriage';
import { GetAvailableSeatsUseCase } from './application/use-cases/trains/get-available-seats';
import { CreateBookingUseCase } from './application/use-cases/bookings/create-booking';
import { CancelBookingUseCase } from './application/use-cases/bookings/cancel-booking';
import { GetUserBookingsUseCase } from './application/use-cases/bookings/get-user-bookings';

import { AuthController } from './presentation/controllers/auth-controller';
import { StationController } from './presentation/controllers/station-controller';
import { RouteController } from './presentation/controllers/route-controller';
import { TrainController } from './presentation/controllers/train-controller';
import { BookingController } from './presentation/controllers/booking-controller';

import { createAuthMiddleware } from './presentation/middleware/auth-middleware';
import { errorHandler } from './presentation/middleware/error-handler';
import { contentNegotiation } from './presentation/middleware/content-negotiation';
import { createApiRouter } from './presentation/routes';

//Infrastructure
const userRepo = new PrismaUserRepository(prisma);
const stationRepo = new PrismaStationRepository(prisma);
const routeRepo = new PrismaRouteRepository(prisma);
const trainRepo = new PrismaTrainRepository(prisma);
const bookingRepo = new PrismaBookingRepository(prisma);
const bookingReadRepo = new PrismaBookingReadRepository(prisma);

const hasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService(
  process.env.JWT_ACCESS_SECRET || 'access-secret',
  process.env.JWT_REFRESH_SECRET || 'refresh-secret'
);

//Domain Factories
const userFactory = new UserFactory(userRepo, hasher);
const stationFactory = new StationFactory(stationRepo);
const routeFactory = new RouteFactory(stationRepo);
const trainFactory = new TrainFactory(trainRepo, routeRepo);
const bookingFactory = new BookingFactory(bookingRepo, trainRepo);

//Application Use Cases
const registerUC = new RegisterUserUseCase(userFactory, userRepo, tokenService);
const loginUC = new LoginUserUseCase(userRepo, hasher, tokenService);
const refreshUC = new RefreshTokenUseCase(userRepo, tokenService);

const createStationUC = new CreateStationUseCase(stationFactory, stationRepo);
const updateStationUC = new UpdateStationUseCase(stationRepo);
const deleteStationUC = new DeleteStationUseCase(stationRepo);
const getStationsUC = new GetStationsUseCase(stationRepo);

const createRouteUC = new CreateRouteUseCase(routeFactory, routeRepo);
const updateRouteUC = new UpdateRouteUseCase(routeRepo, stationRepo);
const deleteRouteUC = new DeleteRouteUseCase(routeRepo);
const getRoutesUC = new GetRoutesUseCase(routeRepo);

const createTrainUC = new CreateTrainUseCase(trainFactory, trainRepo);
const updateTrainUC = new UpdateTrainUseCase(trainRepo, routeRepo);
const deleteTrainUC = new DeleteTrainUseCase(trainRepo);
const searchTrainsUC = new SearchTrainsUseCase(trainRepo);
const getAllTrainsUC = new GetAllTrainsUseCase(trainRepo);
const addCarriageUC = new AddCarriageUseCase(trainRepo);
const getSeatsUC = new GetAvailableSeatsUseCase(trainRepo, bookingRepo);

const createBookingUC = new CreateBookingUseCase(bookingFactory, bookingRepo);
const cancelBookingUC = new CancelBookingUseCase(bookingRepo);
const getUserBookingsUC = new GetUserBookingsUseCase(bookingReadRepo);

//Presentation Controllers
const authController = new AuthController(registerUC, loginUC, refreshUC);
const stationController = new StationController(createStationUC, updateStationUC, deleteStationUC, getStationsUC);
const routeController = new RouteController(createRouteUC, updateRouteUC, deleteRouteUC, getRoutesUC);
const trainController = new TrainController(createTrainUC, updateTrainUC, deleteTrainUC, searchTrainsUC, addCarriageUC, getSeatsUC, getAllTrainsUC);
const bookingController = new BookingController(createBookingUC, cancelBookingUC, getUserBookingsUC);


const app = express();

app.use(cors());
app.use(express.json());

const authMiddleware = createAuthMiddleware(tokenService);
const apiRouter = createApiRouter(
  { auth: authController, station: stationController, route: routeController, train: trainController, booking: bookingController },
  authMiddleware
);

app.get('/health/alive', (_req, res) => {
  res.status(200).type('text/plain').send('OK');
});

app.get('/health/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).type('text/plain').send('OK');
  } catch {
    res.status(500).type('text/plain').send('Database connection failed');
  }
});


app.get('/', (_req, res) => {
  res.type('text/html').send(`<!DOCTYPE html>
<html>
<head><title>TicketBooking API</title></head>
<body>
<h1>TicketBooking API</h1>
<p>Train ticket booking system</p>

<h2>Health</h2>
<table border="1" cellpadding="6" cellspacing="0">
<tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
<tr><td>GET</td><td>/health/alive</td><td>Liveness probe</td></tr>
<tr><td>GET</td><td>/health/ready</td><td>Readiness probe (checks DB)</td></tr>
</table>

<h2>Auth</h2>
<table border="1" cellpadding="6" cellspacing="0">
<tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
<tr><td>POST</td><td>/api/auth/register</td><td>Register a new user</td></tr>
<tr><td>POST</td><td>/api/auth/login</td><td>Login</td></tr>
<tr><td>POST</td><td>/api/auth/refresh</td><td>Refresh access token</td></tr>
</table>

<h2>Stations</h2>
<table border="1" cellpadding="6" cellspacing="0">
<tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
<tr><td>GET</td><td>/api/stations</td><td>List all stations</td></tr>
<tr><td>POST</td><td>/api/stations</td><td>Create station</td></tr>
<tr><td>PUT</td><td>/api/stations/:id</td><td>Update station</td></tr>
<tr><td>DELETE</td><td>/api/stations/:id</td><td>Delete station</td></tr>
</table>

<h2>Routes</h2>
<table border="1" cellpadding="6" cellspacing="0">
<tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
<tr><td>GET</td><td>/api/routes</td><td>List all routes</td></tr>
<tr><td>POST</td><td>/api/routes</td><td>Create route</td></tr>
<tr><td>PUT</td><td>/api/routes/:id</td><td>Update route</td></tr>
<tr><td>DELETE</td><td>/api/routes/:id</td><td>Delete route</td></tr>
</table>

<h2>Trains</h2>
<table border="1" cellpadding="6" cellspacing="0">
<tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
<tr><td>GET</td><td>/api/trains</td><td>List all trains</td></tr>
<tr><td>GET</td><td>/api/trains/search</td><td>Search trains (origin, destination, date)</td></tr>
<tr><td>POST</td><td>/api/trains</td><td>Create train</td></tr>
<tr><td>PUT</td><td>/api/trains/:id</td><td>Update train</td></tr>
<tr><td>DELETE</td><td>/api/trains/:id</td><td>Delete train</td></tr>
<tr><td>POST</td><td>/api/trains/:id/carriages</td><td>Add carriage</td></tr>
<tr><td>GET</td><td>/api/trains/:id/seats</td><td>View seat availability</td></tr>
</table>

<h2>Bookings</h2>
<table border="1" cellpadding="6" cellspacing="0">
<tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
<tr><td>GET</td><td>/api/bookings</td><td>My bookings</td></tr>
<tr><td>POST</td><td>/api/bookings</td><td>Book a seat</td></tr>
<tr><td>PATCH</td><td>/api/bookings/:id/cancel</td><td>Cancel booking</td></tr>
</table>

</body>
</html>`);
});

app.use('/api', contentNegotiation, apiRouter);
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
