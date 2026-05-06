import request from 'supertest';
import { setupTestApp, app, cleanDatabase, getAdminToken } from './setup';

setupTestApp();

describe('Trains Integration', () => {
  let adminToken: string;
  let routeId: string;

  beforeEach(async () => {
    await cleanDatabase();
    adminToken = getAdminToken();

    const s1 = await request(app)
      .post('/api/stations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Kyiv', city: 'Kyiv' });

    const s2 = await request(app)
      .post('/api/stations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Lviv', city: 'Lviv' });

    const route = await request(app)
      .post('/api/routes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        stops: [
          { stationId: s1.body.id, orderIndex: 0 },
          { stationId: s2.body.id, orderIndex: 1 },
        ],
      });
    routeId = route.body.id;
  });

  describe('POST /api/trains', () => {
    it('should create a train and return id', async () => {
      const res = await request(app)
        .post('/api/trains')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          number: 'K42',
          routeId,
          departureTime: '2027-06-01T08:00:00Z',
          arrivalTime: '2027-06-01T14:00:00Z',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
    });

    it('should return 409 on duplicate train number', async () => {
      await request(app)
        .post('/api/trains')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ number: 'K42', routeId, departureTime: '2027-06-01T08:00:00Z', arrivalTime: '2027-06-01T14:00:00Z' });

      const res = await request(app)
        .post('/api/trains')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ number: 'K42', routeId, departureTime: '2027-07-01T08:00:00Z', arrivalTime: '2027-07-01T14:00:00Z' });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/trains/:id/carriages', () => {
    it('should add a carriage and return its id', async () => {
      const train = await request(app)
        .post('/api/trains')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ number: 'K42', routeId, departureTime: '2027-06-01T08:00:00Z', arrivalTime: '2027-06-01T14:00:00Z' });

      const res = await request(app)
        .post(`/api/trains/${train.body.id}/carriages`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ number: 1, type: 'coupe', seatCount: 36 });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();

      const all = await request(app).get('/api/trains');
      const t = all.body.find((t: any) => t.id === train.body.id);
      expect(t.carriages).toHaveLength(1);
      expect(t.carriages[0].seats).toHaveLength(36);
    });
  });

  describe('GET /api/trains/:id/seats', () => {
    it('should return seat availability via query handler', async () => {
      const train = await request(app)
        .post('/api/trains')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ number: 'K42', routeId, departureTime: '2027-06-01T08:00:00Z', arrivalTime: '2027-06-01T14:00:00Z' });

      await request(app)
        .post(`/api/trains/${train.body.id}/carriages`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ number: 1, type: 'coupe', seatCount: 4 });

      const res = await request(app)
        .get(`/api/trains/${train.body.id}/seats`)
        .query({ date: '2027-06-15' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].seats).toHaveLength(4);
      expect(res.body[0].seats[0].isBooked).toBe(false);
    });
  });

  describe('DELETE /api/trains/:id', () => {
    it('should delete a train without active bookings', async () => {
      const train = await request(app)
        .post('/api/trains')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ number: 'K42', routeId, departureTime: '2027-06-01T08:00:00Z', arrivalTime: '2027-06-01T14:00:00Z' });

      const res = await request(app)
        .delete(`/api/trains/${train.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });
  });
});
