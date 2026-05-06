import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import express, { Express } from 'express';

import { PrismaUserRepository } from '../../src/infrastructure/repositories/prisma-user-repository';
import { PrismaStationRepository } from '../../src/infrastructure/repositories/prisma-station-repository';
import { PrismaRouteRepository } from '../../src/infrastructure/repositories/prisma-route-repository';
import { PrismaTrainRepository } from '../../src/infrastructure/repositories/prisma-train-repository';
import { PrismaBookingRepository } from '../../src/infrastructure/repositories/prisma-booking-repository';
import { PrismaBookingReadRepository } from '../../src/infrastructure/repositories/prisma-booking-read-repository';
import { PrismaStationReadRepository } from '../../src/infrastructure/repositories/prisma-station-read-repository';
import { PrismaRouteReadRepository } from '../../src/infrastructure/repositories/prisma-route-read-repository';
import { PrismaTrainReadRepository } from '../../src/infrastructure/repositories/prisma-train-read-repository';
import { BcryptPasswordHasher } from '../../src/infrastructure/auth/bcrypt-password-hasher';
import { JwtTokenService } from '../../src/infrastructure/auth/jwt-token-service';

import { UserFactory } from '../../src/domain/factories/user-factory';
import { StationFactory } from '../../src/domain/factories/station-factory';
import { RouteFactory } from '../../src/domain/factories/route-factory';
import { TrainFactory } from '../../src/domain/factories/train-factory';
import { BookingFactory } from '../../src/domain/factories/booking-factory';

// Command Handlers
import { RegisterUserCommandHandler } from '../../src/application/commands/auth/register-user.handler';
import { LoginUserCommandHandler } from '../../src/application/commands/auth/login-user.handler';
import { RefreshTokenCommandHandler } from '../../src/application/commands/auth/refresh-token.handler';
import { CreateStationCommandHandler } from '../../src/application/commands/stations/create-station.handler';
import { UpdateStationCommandHandler } from '../../src/application/commands/stations/update-station.handler';
import { DeleteStationCommandHandler } from '../../src/application/commands/stations/delete-station.handler';
import { CreateRouteCommandHandler } from '../../src/application/commands/routes/create-route.handler';
import { UpdateRouteCommandHandler } from '../../src/application/commands/routes/update-route.handler';
import { DeleteRouteCommandHandler } from '../../src/application/commands/routes/delete-route.handler';
import { CreateTrainCommandHandler } from '../../src/application/commands/trains/create-train.handler';
import { UpdateTrainCommandHandler } from '../../src/application/commands/trains/update-train.handler';
import { DeleteTrainCommandHandler } from '../../src/application/commands/trains/delete-train.handler';
import { AddCarriageCommandHandler } from '../../src/application/commands/trains/add-carriage.handler';
import { CreateBookingCommandHandler } from '../../src/application/commands/bookings/create-booking.handler';
import { CancelBookingCommandHandler } from '../../src/application/commands/bookings/cancel-booking.handler';

// Query Handlers
import { GetStationsQueryHandler } from '../../src/application/queries/stations/get-stations.handler';
import { GetRoutesQueryHandler } from '../../src/application/queries/routes/get-routes.handler';
import { GetAllTrainsQueryHandler } from '../../src/application/queries/trains/get-all-trains.handler';
import { SearchTrainsQueryHandler } from '../../src/application/queries/trains/search-trains.handler';
import { GetAvailableSeatsQueryHandler } from '../../src/application/queries/trains/get-available-seats.handler';
import { GetUserBookingsQueryHandler } from '../../src/application/queries/bookings/get-user-bookings.handler';

import { AuthController } from '../../src/presentation/controllers/auth-controller';
import { StationController } from '../../src/presentation/controllers/station-controller';
import { RouteController } from '../../src/presentation/controllers/route-controller';
import { TrainController } from '../../src/presentation/controllers/train-controller';
import { BookingController } from '../../src/presentation/controllers/booking-controller';
import { createAuthMiddleware } from '../../src/presentation/middleware/auth-middleware';
import { errorHandler } from '../../src/presentation/middleware/error-handler';
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

    // Controllers
    const authController = new AuthController(registerHandler, loginHandler, refreshHandler);
    const stationController = new StationController(createStationHandler, updateStationHandler, deleteStationHandler, getStationsHandler);
    const routeController = new RouteController(createRouteHandler, updateRouteHandler, deleteRouteHandler, getRoutesHandler);
    const trainController = new TrainController(createTrainHandler, updateTrainHandler, deleteTrainHandler, addCarriageHandler, getAllTrainsHandler, searchTrainsHandler, getSeatsHandler);
    const bookingController = new BookingController(createBookingHandler, cancelBookingHandler, getBookingsHandler);

    const authMiddleware = createAuthMiddleware(tokenService);
    const apiRouter = createApiRouter(
      { auth: authController, station: stationController, route: routeController, train: trainController, booking: bookingController },
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
