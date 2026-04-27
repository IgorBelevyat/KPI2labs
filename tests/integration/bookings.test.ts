import request from 'supertest';
import { setupTestApp, app, cleanDatabase, getAdminToken, tokenService } from './setup';

setupTestApp();

describe('Bookings Integration', () => {
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let trainId: string;
  let seatId: string;

  beforeEach(async () => {
    await cleanDatabase();
    adminToken = getAdminToken();

    // Register a real user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Traveler', email: 'traveler@test.com', password: 'Password1' });
    userToken = userRes.body.accessToken;
    userId = userRes.body.user.id;

    // Create station → route → train → carriage
    const s1 = await request(app).post('/api/stations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Kyiv', city: 'Kyiv' });
    const s2 = await request(app).post('/api/stations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Lviv', city: 'Lviv' });
    const route = await request(app).post('/api/routes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ stops: [{ stationId: s1.body.id, orderIndex: 0 }, { stationId: s2.body.id, orderIndex: 1 }] });
    const train = await request(app).post('/api/trains')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ number: 'K42', routeId: route.body.id, departureTime: '2027-06-01T08:00:00Z', arrivalTime: '2027-06-01T14:00:00Z' });
    trainId = train.body.id;

    const withCarriage = await request(app)
      .post(`/api/trains/${trainId}/carriages`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ number: 1, type: 'coupe', seatCount: 4 });
    seatId = withCarriage.body.carriages[0].seats[0].id;
  });

  describe('POST /api/bookings', () => {
    it('should create a booking for authenticated user', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ trainId, seatId, travelDate: '2027-06-15' });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(userId);
      expect(res.body.status).toBe('created');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({ trainId, seatId, travelDate: '2027-06-15' });

      expect(res.status).toBe(401);
    });

    it('should return 409 on double booking same seat', async () => {
      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ trainId, seatId, travelDate: '2027-06-15' });

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ trainId, seatId, travelDate: '2027-06-15' });

      expect(res.status).toBe(409);
    });
  });

  describe('PATCH /api/bookings/:id/cancel', () => {
    it('should cancel own booking', async () => {
      const booking = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ trainId, seatId, travelDate: '2027-06-15' });

      const res = await request(app)
        .patch(`/api/bookings/${booking.body.id}/cancel`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('cancelled');
    });

    it('should return 403 if another user tries to cancel', async () => {
      const booking = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ trainId, seatId, travelDate: '2027-06-15' });

      // Register another user
      const otherUser = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Other', email: 'other@test.com', password: 'Password1' });

      const res = await request(app)
        .patch(`/api/bookings/${booking.body.id}/cancel`)
        .set('Authorization', `Bearer ${otherUser.body.accessToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/bookings/my', () => {
    it('should return bookings for current user', async () => {
      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ trainId, seatId, travelDate: '2027-06-15' });

      const res = await request(app)
        .get('/api/bookings/my')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].trainId).toBe(trainId);
    });
  });
});
