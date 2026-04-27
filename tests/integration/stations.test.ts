import request from 'supertest';
import { setupTestApp, app, cleanDatabase, getAdminToken, getUserToken } from './setup';

setupTestApp();

describe('Stations Integration', () => {
  let adminToken: string;

  beforeEach(async () => {
    await cleanDatabase();
    adminToken = getAdminToken();
  });

  describe('POST /api/stations', () => {
    it('should create a station as admin', async () => {
      const res = await request(app)
        .post('/api/stations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Kyiv-Pasazhyrskyi', city: 'Kyiv' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Kyiv-Pasazhyrskyi');
      expect(res.body.city).toBe('Kyiv');
      expect(res.body.id).toBeDefined();
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/stations')
        .send({ name: 'Kyiv', city: 'Kyiv' });

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .post('/api/stations')
        .set('Authorization', `Bearer ${getUserToken()}`)
        .send({ name: 'Kyiv', city: 'Kyiv' });

      expect(res.status).toBe(403);
    });

    it('should return 409 on duplicate station name', async () => {
      await request(app)
        .post('/api/stations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Kyiv', city: 'Kyiv' });

      const res = await request(app)
        .post('/api/stations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Kyiv', city: 'Kyiv' });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/stations', () => {
    it('should return all stations (no auth required)', async () => {
      await request(app)
        .post('/api/stations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Kyiv', city: 'Kyiv' });

      const res = await request(app).get('/api/stations');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Kyiv');
    });
  });

  describe('PUT /api/stations/:id', () => {
    it('should update a station', async () => {
      const created = await request(app)
        .post('/api/stations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Kyiv', city: 'Kyiv' });

      const res = await request(app)
        .put(`/api/stations/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Kyiv-Pasazhyrskyi', city: 'Kyiv' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Kyiv-Pasazhyrskyi');
    });
  });

  describe('DELETE /api/stations/:id', () => {
    it('should delete a station', async () => {
      const created = await request(app)
        .post('/api/stations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Temporary', city: 'Test' });

      const res = await request(app)
        .delete(`/api/stations/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });
  });
});
