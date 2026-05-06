import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import prisma from './infrastructure/database/prisma-client';

// Infrastructure — Repositories (write / domain)
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user-repository';
import { PrismaStationRepository } from './infrastructure/repositories/prisma-station-repository';
import { PrismaRouteRepository } from './infrastructure/repositories/prisma-route-repository';
import { PrismaTrainRepository } from './infrastructure/repositories/prisma-train-repository';
import { PrismaBookingRepository } from './infrastructure/repositories/prisma-booking-repository';

// Infrastructure — Read Repositories (query)
import { PrismaStationReadRepository } from './infrastructure/repositories/prisma-station-read-repository';
import { PrismaRouteReadRepository } from './infrastructure/repositories/prisma-route-read-repository';
import { PrismaTrainReadRepository } from './infrastructure/repositories/prisma-train-read-repository';
import { PrismaBookingReadRepository } from './infrastructure/repositories/prisma-booking-read-repository';

// Infrastructure — Auth
import { BcryptPasswordHasher } from './infrastructure/auth/bcrypt-password-hasher';
import { JwtTokenService } from './infrastructure/auth/jwt-token-service';

// Domain — Factories
import { UserFactory } from './domain/factories/user-factory';
import { StationFactory } from './domain/factories/station-factory';
import { RouteFactory } from './domain/factories/route-factory';
import { TrainFactory } from './domain/factories/train-factory';
import { BookingFactory } from './domain/factories/booking-factory';

// Application — Command Handlers
import { RegisterUserCommandHandler } from './application/commands/auth/register-user.handler';
import { LoginUserCommandHandler } from './application/commands/auth/login-user.handler';
import { RefreshTokenCommandHandler } from './application/commands/auth/refresh-token.handler';
import { CreateStationCommandHandler } from './application/commands/stations/create-station.handler';
import { UpdateStationCommandHandler } from './application/commands/stations/update-station.handler';
import { DeleteStationCommandHandler } from './application/commands/stations/delete-station.handler';
import { CreateRouteCommandHandler } from './application/commands/routes/create-route.handler';
import { UpdateRouteCommandHandler } from './application/commands/routes/update-route.handler';
import { DeleteRouteCommandHandler } from './application/commands/routes/delete-route.handler';
import { CreateTrainCommandHandler } from './application/commands/trains/create-train.handler';
import { UpdateTrainCommandHandler } from './application/commands/trains/update-train.handler';
import { DeleteTrainCommandHandler } from './application/commands/trains/delete-train.handler';
import { AddCarriageCommandHandler } from './application/commands/trains/add-carriage.handler';
import { CreateBookingCommandHandler } from './application/commands/bookings/create-booking.handler';
import { CancelBookingCommandHandler } from './application/commands/bookings/cancel-booking.handler';

// Application — Query Handlers
import { GetStationsQueryHandler } from './application/queries/stations/get-stations.handler';
import { GetRoutesQueryHandler } from './application/queries/routes/get-routes.handler';
import { GetAllTrainsQueryHandler } from './application/queries/trains/get-all-trains.handler';
import { SearchTrainsQueryHandler } from './application/queries/trains/search-trains.handler';
import { GetAvailableSeatsQueryHandler } from './application/queries/trains/get-available-seats.handler';
import { GetUserBookingsQueryHandler } from './application/queries/bookings/get-user-bookings.handler';

// Presentation
import { AuthController } from './presentation/controllers/auth-controller';
import { StationController } from './presentation/controllers/station-controller';
import { RouteController } from './presentation/controllers/route-controller';
import { TrainController } from './presentation/controllers/train-controller';
import { BookingController } from './presentation/controllers/booking-controller';

import { createAuthMiddleware } from './presentation/middleware/auth-middleware';
import { errorHandler } from './presentation/middleware/error-handler';
import { contentNegotiation } from './presentation/middleware/content-negotiation';
import { createApiRouter } from './presentation/routes';

// Infrastructure
const userRepo = new PrismaUserRepository(prisma);
const stationRepo = new PrismaStationRepository(prisma);
const routeRepo = new PrismaRouteRepository(prisma);
const trainRepo = new PrismaTrainRepository(prisma);
const bookingRepo = new PrismaBookingRepository(prisma);

const stationReadRepo = new PrismaStationReadRepository(prisma);
const routeReadRepo = new PrismaRouteReadRepository(prisma);
const trainReadRepo = new PrismaTrainReadRepository(prisma);
const bookingReadRepo = new PrismaBookingReadRepository(prisma);

const hasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService(
  process.env.JWT_ACCESS_SECRET || 'access-secret',
  process.env.JWT_REFRESH_SECRET || 'refresh-secret'
);

// Domain Factories
const userFactory = new UserFactory(userRepo, hasher);
const stationFactory = new StationFactory(stationRepo);
const routeFactory = new RouteFactory(stationRepo);
const trainFactory = new TrainFactory(trainRepo, routeRepo);
const bookingFactory = new BookingFactory(bookingRepo, trainRepo);

// Command Handlers
const registerHandler = new RegisterUserCommandHandler(userFactory, userRepo, tokenService);
const loginHandler = new LoginUserCommandHandler(userRepo, hasher, tokenService);
const refreshHandler = new RefreshTokenCommandHandler(userRepo, tokenService);

const createStationHandler = new CreateStationCommandHandler(stationFactory, stationRepo);
const updateStationHandler = new UpdateStationCommandHandler(stationRepo);
const deleteStationHandler = new DeleteStationCommandHandler(stationRepo);

const createRouteHandler = new CreateRouteCommandHandler(routeFactory, routeRepo);
const updateRouteHandler = new UpdateRouteCommandHandler(routeRepo, stationRepo);
const deleteRouteHandler = new DeleteRouteCommandHandler(routeRepo);

const createTrainHandler = new CreateTrainCommandHandler(trainFactory, trainRepo);
const updateTrainHandler = new UpdateTrainCommandHandler(trainRepo, routeRepo);
const deleteTrainHandler = new DeleteTrainCommandHandler(trainRepo);
const addCarriageHandler = new AddCarriageCommandHandler(trainRepo);

const createBookingHandler = new CreateBookingCommandHandler(bookingFactory, bookingRepo);
const cancelBookingHandler = new CancelBookingCommandHandler(bookingRepo);

// Query Handlers
const getStationsHandler = new GetStationsQueryHandler(stationReadRepo);
const getRoutesHandler = new GetRoutesQueryHandler(routeReadRepo);
const getAllTrainsHandler = new GetAllTrainsQueryHandler(trainReadRepo);
const searchTrainsHandler = new SearchTrainsQueryHandler(trainReadRepo);
const getSeatsHandler = new GetAvailableSeatsQueryHandler(trainReadRepo);
const getBookingsHandler = new GetUserBookingsQueryHandler(bookingReadRepo);

// Presentation Controllers
const authController = new AuthController(registerHandler, loginHandler, refreshHandler);
const stationController = new StationController(createStationHandler, updateStationHandler, deleteStationHandler, getStationsHandler);
const routeController = new RouteController(createRouteHandler, updateRouteHandler, deleteRouteHandler, getRoutesHandler);
const trainController = new TrainController(createTrainHandler, updateTrainHandler, deleteTrainHandler, addCarriageHandler, getAllTrainsHandler, searchTrainsHandler, getSeatsHandler);
const bookingController = new BookingController(createBookingHandler, cancelBookingHandler, getBookingsHandler);


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
