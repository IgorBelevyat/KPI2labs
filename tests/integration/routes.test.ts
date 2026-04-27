import request from 'supertest';
import { setupTestApp, app, cleanDatabase, getAdminToken } from './setup';

setupTestApp();

describe('Routes Integration', () => {
  let adminToken: string;
  let stationId1: string;
  let stationId2: string;

  beforeEach(async () => {
    await cleanDatabase();
    adminToken = getAdminToken();

    const s1 = await request(app)
      .post('/api/stations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Kyiv', city: 'Kyiv' });
    stationId1 = s1.body.id;

    const s2 = await request(app)
      .post('/api/stations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Lviv', city: 'Lviv' });
    stationId2 = s2.body.id;
  });

  describe('POST /api/routes', () => {
    it('should create a route with 2 stops', async () => {
      const res = await request(app)
        .post('/api/routes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stops: [
            { stationId: stationId1, orderIndex: 0 },
            { stationId: stationId2, orderIndex: 1 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.stops).toHaveLength(2);
    });

    it('should return 400 with less than 2 stops', async () => {
      const res = await request(app)
        .post('/api/routes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stops: [{ stationId: stationId1, orderIndex: 0 }],
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/routes', () => {
    it('should return all routes', async () => {
      await request(app)
        .post('/api/routes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stops: [
            { stationId: stationId1, orderIndex: 0 },
            { stationId: stationId2, orderIndex: 1 },
          ],
        });

      const res = await request(app).get('/api/routes');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('DELETE /api/routes/:id', () => {
    it('should delete a route not used by trains', async () => {
      const created = await request(app)
        .post('/api/routes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stops: [
            { stationId: stationId1, orderIndex: 0 },
            { stationId: stationId2, orderIndex: 1 },
          ],
        });

      const res = await request(app)
        .delete(`/api/routes/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });
  });
});
