import request from 'supertest';
import { setupTestApp, app, cleanDatabase, prisma } from './setup';

setupTestApp();

describe('Auth Integration', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John', email: 'john@test.com', password: 'Password1' });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('john@test.com');
      expect(res.body.user.role).toBe('user');
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('should return 400 on missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'john@test.com' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 409 on duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'John', email: 'john@test.com', password: 'Password1' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Jane', email: 'john@test.com', password: 'Password1' });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'John', email: 'john@test.com', password: 'Password1' });
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@test.com', password: 'Password1' });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it('should return 400 on wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@test.com', password: 'WrongPass1' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should issue new tokens with valid refresh token', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John', email: 'john@test.com', password: 'Password1' });

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: registerRes.body.refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it('should return 400 on invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(400);
    });
  });
});
