import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import express, { Express } from 'express';

import { PrismaUserRepository } from '../../src/modules/booking/infrastructure/repositories/prisma-user-repository';
import { PrismaStationRepository } from '../../src/modules/catalog/infrastructure/repositories/prisma-station-repository';
import { PrismaRouteRepository } from '../../src/modules/catalog/infrastructure/repositories/prisma-route-repository';
import { PrismaTrainRepository } from '../../src/modules/catalog/infrastructure/repositories/prisma-train-repository';
import { PrismaBookingRepository } from '../../src/modules/booking/infrastructure/repositories/prisma-booking-repository';
import { PrismaBookingReadRepository } from '../../src/modules/booking/infrastructure/repositories/prisma-booking-read-repository';
import { PrismaStationReadRepository } from '../../src/modules/catalog/infrastructure/repositories/prisma-station-read-repository';
import { PrismaRouteReadRepository } from '../../src/modules/catalog/infrastructure/repositories/prisma-route-read-repository';
import { PrismaTrainReadRepository } from '../../src/modules/catalog/infrastructure/repositories/prisma-train-read-repository';
import { BcryptPasswordHasher } from '../../src/shared/auth/bcrypt-password-hasher';
import { JwtTokenService } from '../../src/shared/auth/jwt-token-service';

import { UserFactory } from '../../src/modules/booking/domain/factories/user-factory';
import { StationFactory } from '../../src/modules/catalog/domain/factories/station-factory';
import { RouteFactory } from '../../src/modules/catalog/domain/factories/route-factory';
import { TrainFactory } from '../../src/modules/catalog/domain/factories/train-factory';
import { BookingFactory } from '../../src/modules/booking/domain/factories/booking-factory';
import { CatalogFacade } from '../../src/modules/catalog';
import { CatalogAdapter } from '../../src/modules/booking/infrastructure/acl/catalog-adapter';

// Command Handlers
import { RegisterUserCommandHandler } from '../../src/modules/booking/application/commands/auth/register-user.handler';
import { LoginUserCommandHandler } from '../../src/modules/booking/application/commands/auth/login-user.handler';
import { RefreshTokenCommandHandler } from '../../src/modules/booking/application/commands/auth/refresh-token.handler';
import { CreateStationCommandHandler } from '../../src/modules/catalog/application/commands/stations/create-station.handler';
import { UpdateStationCommandHandler } from '../../src/modules/catalog/application/commands/stations/update-station.handler';
import { DeleteStationCommandHandler } from '../../src/modules/catalog/application/commands/stations/delete-station.handler';
import { CreateRouteCommandHandler } from '../../src/modules/catalog/application/commands/routes/create-route.handler';
import { UpdateRouteCommandHandler } from '../../src/modules/catalog/application/commands/routes/update-route.handler';
import { DeleteRouteCommandHandler } from '../../src/modules/catalog/application/commands/routes/delete-route.handler';
import { CreateTrainCommandHandler } from '../../src/modules/catalog/application/commands/trains/create-train.handler';
import { UpdateTrainCommandHandler } from '../../src/modules/catalog/application/commands/trains/update-train.handler';
import { DeleteTrainCommandHandler } from '../../src/modules/catalog/application/commands/trains/delete-train.handler';
import { AddCarriageCommandHandler } from '../../src/modules/catalog/application/commands/trains/add-carriage.handler';
import { CreateBookingCommandHandler } from '../../src/modules/booking/application/commands/bookings/create-booking.handler';
import { CancelBookingCommandHandler } from '../../src/modules/booking/application/commands/bookings/cancel-booking.handler';

// Query Handlers
import { GetStationsQueryHandler } from '../../src/modules/catalog/application/queries/stations/get-stations.handler';
import { GetRoutesQueryHandler } from '../../src/modules/catalog/application/queries/routes/get-routes.handler';
import { GetAllTrainsQueryHandler } from '../../src/modules/catalog/application/queries/trains/get-all-trains.handler';
import { SearchTrainsQueryHandler } from '../../src/modules/catalog/application/queries/trains/search-trains.handler';
import { GetAvailableSeatsQueryHandler } from '../../src/modules/catalog/application/queries/trains/get-available-seats.handler';
import { GetUserBookingsQueryHandler } from '../../src/modules/booking/application/queries/bookings/get-user-bookings.handler';
import { GetStatsQueryHandler } from '../../src/modules/analytics/application/queries/get-stats.handler';

import { AuthController } from '../../src/modules/booking/presentation/controllers/auth-controller';
import { StationController } from '../../src/modules/catalog/presentation/controllers/station-controller';
import { RouteController } from '../../src/modules/catalog/presentation/controllers/route-controller';
import { TrainController } from '../../src/modules/catalog/presentation/controllers/train-controller';
import { BookingController } from '../../src/modules/booking/presentation/controllers/booking-controller';
import { AnalyticsController } from '../../src/modules/analytics/presentation/controllers/analytics-controller';

import { PrismaAnalyticsRepository } from '../../src/modules/analytics/infrastructure/repositories/prisma-analytics-repository';
import { PrismaAnalyticsReadRepository } from '../../src/modules/analytics/infrastructure/repositories/prisma-analytics-read-repository';
import { createAuthMiddleware } from '../../src/shared/middlewares/auth-middleware';
import { errorHandler } from '../../src/shared/middlewares/error-handler';
import { createApiRouter } from '../../src/presentation/routes';

export let prisma: PrismaClient;
export let app: Express;
export let tokenService: JwtTokenService;

export function setupTestApp() {
  beforeAll(async () => {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    prisma = new PrismaClient({ adapter });
    await prisma.$connect();

    // Infrastructure — write repos
    const userRepo = new PrismaUserRepository(prisma);
    const stationRepo = new PrismaStationRepository(prisma);
    const routeRepo = new PrismaRouteRepository(prisma);
    const trainRepo = new PrismaTrainRepository(prisma);
    const bookingRepo = new PrismaBookingRepository(prisma);

    // Infrastructure — read repos
    const stationReadRepo = new PrismaStationReadRepository(prisma);
    const routeReadRepo = new PrismaRouteReadRepository(prisma);
    const trainReadRepo = new PrismaTrainReadRepository(prisma);
    const bookingReadRepo = new PrismaBookingReadRepository(prisma);

    const hasher = new BcryptPasswordHasher();
    tokenService = new JwtTokenService('test-access-secret', 'test-refresh-secret');

    const userFactory = new UserFactory(userRepo, hasher);
    const stationFactory = new StationFactory(stationRepo);
    const routeFactory = new RouteFactory(stationRepo);
    const trainFactory = new TrainFactory(trainRepo, routeRepo);
    const catalogFacade = new CatalogFacade(trainRepo);
    const catalogAdapter = new CatalogAdapter(catalogFacade);
    const bookingFactory = new BookingFactory(bookingRepo, catalogAdapter);

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

    // Analytics
    const analyticsRepo = new PrismaAnalyticsRepository(prisma);
    const analyticsReadRepo = new PrismaAnalyticsReadRepository(prisma);
    const getStatsHandler = new GetStatsQueryHandler(analyticsReadRepo);
    const analyticsController = new AnalyticsController(getStatsHandler);

    // Controllers
    const authController = new AuthController(registerHandler, loginHandler, refreshHandler);
    const stationController = new StationController(createStationHandler, updateStationHandler, deleteStationHandler, getStationsHandler);
    const routeController = new RouteController(createRouteHandler, updateRouteHandler, deleteRouteHandler, getRoutesHandler);
    const trainController = new TrainController(createTrainHandler, updateTrainHandler, deleteTrainHandler, addCarriageHandler, getAllTrainsHandler, searchTrainsHandler, getSeatsHandler);
    const bookingController = new BookingController(createBookingHandler, cancelBookingHandler, getBookingsHandler);

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

    app = express();
    app.use(express.json());
    app.use('/api', apiRouter);
    app.use(errorHandler);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
}

export async function cleanDatabase() {
  // Sequential deletes to respect FK constraints
  await prisma.booking.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.carriage.deleteMany();
  await prisma.train.deleteMany();
  await prisma.routeStop.deleteMany();
  await prisma.route.deleteMany();
  await prisma.station.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

export function getAdminToken(): string {
  return tokenService.generateAccessToken({ userId: 'admin-test', role: 'admin' });
}

export function getUserToken(userId: string = 'user-test'): string {
  return tokenService.generateAccessToken({ userId, role: 'user' });
}
