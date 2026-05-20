import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import prisma from './shared/database/prisma-client';

// Infrastructure — Repositories (write / domain)
import { PrismaUserRepository } from './modules/booking/infrastructure/repositories/prisma-user-repository';
import { PrismaStationRepository } from './modules/catalog/infrastructure/repositories/prisma-station-repository';
import { PrismaRouteRepository } from './modules/catalog/infrastructure/repositories/prisma-route-repository';
import { PrismaTrainRepository } from './modules/catalog/infrastructure/repositories/prisma-train-repository';
import { PrismaBookingRepository } from './modules/booking/infrastructure/repositories/prisma-booking-repository';

// Infrastructure — Read Repositories (query)
import { PrismaStationReadRepository } from './modules/catalog/infrastructure/repositories/prisma-station-read-repository';
import { PrismaRouteReadRepository } from './modules/catalog/infrastructure/repositories/prisma-route-read-repository';
import { PrismaTrainReadRepository } from './modules/catalog/infrastructure/repositories/prisma-train-read-repository';
import { PrismaBookingReadRepository } from './modules/booking/infrastructure/repositories/prisma-booking-read-repository';

// Infrastructure — Auth
import { BcryptPasswordHasher } from './shared/auth/bcrypt-password-hasher';
import { JwtTokenService } from './shared/auth/jwt-token-service';

// Infrastructure — Notifications
import { ConsoleNotificationService } from './infrastructure/notifications/console-notification-service';

// Infrastructure — Messaging (Kafka)
import { Kafka } from 'kafkajs';
import { KafkaEventBus } from './shared/event-bus/kafka-event-bus';
import { NotificationSubscriber } from './shared/event-bus/notification-subscriber';

// Domain — Factories
import { UserFactory } from './modules/booking/domain/factories/user-factory';
import { StationFactory } from './modules/catalog/domain/factories/station-factory';
import { RouteFactory } from './modules/catalog/domain/factories/route-factory';
import { TrainFactory } from './modules/catalog/domain/factories/train-factory';
import { BookingFactory } from './modules/booking/domain/factories/booking-factory';

// Application — Command Handlers
import { RegisterUserCommandHandler } from './modules/booking/application/commands/auth/register-user.handler';
import { LoginUserCommandHandler } from './modules/booking/application/commands/auth/login-user.handler';
import { RefreshTokenCommandHandler } from './modules/booking/application/commands/auth/refresh-token.handler';
import { CreateStationCommandHandler } from './modules/catalog/application/commands/stations/create-station.handler';
import { UpdateStationCommandHandler } from './modules/catalog/application/commands/stations/update-station.handler';
import { DeleteStationCommandHandler } from './modules/catalog/application/commands/stations/delete-station.handler';
import { CreateRouteCommandHandler } from './modules/catalog/application/commands/routes/create-route.handler';
import { UpdateRouteCommandHandler } from './modules/catalog/application/commands/routes/update-route.handler';
import { DeleteRouteCommandHandler } from './modules/catalog/application/commands/routes/delete-route.handler';
import { CreateTrainCommandHandler } from './modules/catalog/application/commands/trains/create-train.handler';
import { UpdateTrainCommandHandler } from './modules/catalog/application/commands/trains/update-train.handler';
import { DeleteTrainCommandHandler } from './modules/catalog/application/commands/trains/delete-train.handler';
import { AddCarriageCommandHandler } from './modules/catalog/application/commands/trains/add-carriage.handler';
import { CreateBookingCommandHandler } from './modules/booking/application/commands/bookings/create-booking.handler';
import { CancelBookingCommandHandler } from './modules/booking/application/commands/bookings/cancel-booking.handler';

// Application — Query Handlers
import { GetStationsQueryHandler } from './modules/catalog/application/queries/stations/get-stations.handler';
import { GetRoutesQueryHandler } from './modules/catalog/application/queries/routes/get-routes.handler';
import { GetAllTrainsQueryHandler } from './modules/catalog/application/queries/trains/get-all-trains.handler';
import { SearchTrainsQueryHandler } from './modules/catalog/application/queries/trains/search-trains.handler';
import { GetAvailableSeatsQueryHandler } from './modules/catalog/application/queries/trains/get-available-seats.handler';
import { GetUserBookingsQueryHandler } from './modules/booking/application/queries/bookings/get-user-bookings.handler';

// Presentation
import { AuthController } from './modules/booking/presentation/controllers/auth-controller';
import { StationController } from './modules/catalog/presentation/controllers/station-controller';
import { RouteController } from './modules/catalog/presentation/controllers/route-controller';
import { TrainController } from './modules/catalog/presentation/controllers/train-controller';
import { BookingController } from './modules/booking/presentation/controllers/booking-controller';

import { createAuthMiddleware } from './shared/middlewares/auth-middleware';
import { errorHandler } from './shared/middlewares/error-handler';
import { contentNegotiation } from './shared/middlewares/content-negotiation';
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
import { CatalogFacade } from './modules/catalog';
import { CatalogAdapter } from './modules/booking/infrastructure/acl/catalog-adapter';

const catalogFacade = new CatalogFacade(trainRepo);
const catalogAdapter = new CatalogAdapter(catalogFacade);
const bookingFactory = new BookingFactory(bookingRepo, catalogAdapter);

// Analytics Infrastructure
import { PrismaAnalyticsRepository } from './modules/analytics/infrastructure/repositories/prisma-analytics-repository';
import { PrismaAnalyticsReadRepository } from './modules/analytics/infrastructure/repositories/prisma-analytics-read-repository';
import { AnalyticsSubscriber } from './modules/analytics/infrastructure/acl/analytics-subscriber';

// Analytics Application
import { GetStatsQueryHandler } from './modules/analytics/application/queries/get-stats.handler';

// Analytics Presentation
import { AnalyticsController } from './modules/analytics/presentation/controllers/analytics-controller';

const analyticsRepo = new PrismaAnalyticsRepository(prisma);
const analyticsReadRepo = new PrismaAnalyticsReadRepository(prisma);
const getStatsHandler = new GetStatsQueryHandler(analyticsReadRepo);
const analyticsController = new AnalyticsController(getStatsHandler);

// Notification Mode (sync vs async)
const NOTIFICATION_MODE = process.env.NOTIFICATION_MODE || 'sync';
const notificationService = new ConsoleNotificationService();

let kafkaEventBus: KafkaEventBus | undefined;

if (NOTIFICATION_MODE === 'async') {
  const kafka = new Kafka({
    clientId: 'ticketbooking',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  });
  kafkaEventBus = new KafkaEventBus(kafka);

  // Original Notification Subscriber
  const notificationSubscriber = new NotificationSubscriber(notificationService);
  kafkaEventBus.subscribe('BookingCreated', (e) => notificationSubscriber.onBookingCreated(e));
  kafkaEventBus.subscribe('BookingCancelled', (e) => notificationSubscriber.onBookingCancelled(e));

  // Analytics Subscriber
  const analyticsSubscriber = new AnalyticsSubscriber(analyticsRepo);
  kafkaEventBus.subscribe('BookingCreated', (e) => analyticsSubscriber.handleEvent(e));
  kafkaEventBus.subscribe('BookingCancelled', (e) => analyticsSubscriber.handleEvent(e));
}

console.log(`[Config] NOTIFICATION_MODE = ${NOTIFICATION_MODE}`);

// ── Command Handlers ────────────────────────────────────────────────────
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

// Booking handlers — gets notificationService (sync) or eventBus (async)
const createBookingHandler = new CreateBookingCommandHandler(
  bookingFactory,
  bookingRepo,
  NOTIFICATION_MODE === 'sync' ? notificationService : undefined,
  NOTIFICATION_MODE === 'async' ? kafkaEventBus : undefined
);
const cancelBookingHandler = new CancelBookingCommandHandler(
  bookingRepo,
  NOTIFICATION_MODE === 'sync' ? notificationService : undefined,
  NOTIFICATION_MODE === 'async' ? kafkaEventBus : undefined
);

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
  { 
    auth: authController, 
    station: stationController, 
    route: routeController, 
    train: trainController, 
    booking: bookingController,
    analytics: analyticsController 
  },
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

async function start() {
  // Підключити Kafka якщо async-режим
  if (kafkaEventBus) {
    await kafkaEventBus.connect();
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
