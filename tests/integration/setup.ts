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
import { BcryptPasswordHasher } from '../../src/infrastructure/auth/bcrypt-password-hasher';
import { JwtTokenService } from '../../src/infrastructure/auth/jwt-token-service';

import { UserFactory } from '../../src/domain/factories/user-factory';
import { StationFactory } from '../../src/domain/factories/station-factory';
import { RouteFactory } from '../../src/domain/factories/route-factory';
import { TrainFactory } from '../../src/domain/factories/train-factory';
import { BookingFactory } from '../../src/domain/factories/booking-factory';

import { RegisterUserUseCase } from '../../src/application/use-cases/auth/register-user';
import { LoginUserUseCase } from '../../src/application/use-cases/auth/login-user';
import { RefreshTokenUseCase } from '../../src/application/use-cases/auth/refresh-token';
import { CreateStationUseCase } from '../../src/application/use-cases/stations/create-station';
import { UpdateStationUseCase } from '../../src/application/use-cases/stations/update-station';
import { DeleteStationUseCase } from '../../src/application/use-cases/stations/delete-station';
import { GetStationsUseCase } from '../../src/application/use-cases/stations/get-stations';
import { CreateRouteUseCase } from '../../src/application/use-cases/routes/create-route';
import { UpdateRouteUseCase } from '../../src/application/use-cases/routes/update-route';
import { DeleteRouteUseCase } from '../../src/application/use-cases/routes/delete-route';
import { GetRoutesUseCase } from '../../src/application/use-cases/routes/get-routes';
import { CreateTrainUseCase } from '../../src/application/use-cases/trains/create-train';
import { UpdateTrainUseCase } from '../../src/application/use-cases/trains/update-train';
import { DeleteTrainUseCase } from '../../src/application/use-cases/trains/delete-train';
import { SearchTrainsUseCase } from '../../src/application/use-cases/trains/search-trains';
import { GetAllTrainsUseCase } from '../../src/application/use-cases/trains/get-all-trains';
import { AddCarriageUseCase } from '../../src/application/use-cases/trains/add-carriage';
import { GetAvailableSeatsUseCase } from '../../src/application/use-cases/trains/get-available-seats';
import { CreateBookingUseCase } from '../../src/application/use-cases/bookings/create-booking';
import { CancelBookingUseCase } from '../../src/application/use-cases/bookings/cancel-booking';
import { GetUserBookingsUseCase } from '../../src/application/use-cases/bookings/get-user-bookings';

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

    const userRepo = new PrismaUserRepository(prisma);
    const stationRepo = new PrismaStationRepository(prisma);
    const routeRepo = new PrismaRouteRepository(prisma);
    const trainRepo = new PrismaTrainRepository(prisma);
    const bookingRepo = new PrismaBookingRepository(prisma);
    const bookingReadRepo = new PrismaBookingReadRepository(prisma);

    const hasher = new BcryptPasswordHasher();
    tokenService = new JwtTokenService('test-access-secret', 'test-refresh-secret');

    const userFactory = new UserFactory(userRepo, hasher);
    const stationFactory = new StationFactory(stationRepo);
    const routeFactory = new RouteFactory(stationRepo);
    const trainFactory = new TrainFactory(trainRepo, routeRepo);
    const bookingFactory = new BookingFactory(bookingRepo, trainRepo);

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

    const authController = new AuthController(registerUC, loginUC, refreshUC);
    const stationController = new StationController(createStationUC, updateStationUC, deleteStationUC, getStationsUC);
    const routeController = new RouteController(createRouteUC, updateRouteUC, deleteRouteUC, getRoutesUC);
    const trainController = new TrainController(createTrainUC, updateTrainUC, deleteTrainUC, searchTrainsUC, addCarriageUC, getSeatsUC, getAllTrainsUC);
    const bookingController = new BookingController(createBookingUC, cancelBookingUC, getUserBookingsUC);

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
  await prisma.$transaction([
    prisma.booking.deleteMany(),
    prisma.seat.deleteMany(),
    prisma.carriage.deleteMany(),
    prisma.train.deleteMany(),
    prisma.routeStop.deleteMany(),
    prisma.route.deleteMany(),
    prisma.station.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export function getAdminToken(): string {
  return tokenService.generateAccessToken({ userId: 'admin-test', role: 'admin' });
}

export function getUserToken(userId: string = 'user-test'): string {
  return tokenService.generateAccessToken({ userId, role: 'user' });
}
