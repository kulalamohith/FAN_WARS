import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app';
import { db } from '../lib/db';
import { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let testArmyId: string;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();

  // Seed a test army for the onboarding flow
  const army = await db.army.upsert({
    where: { name: 'TEST_ARMY' },
    update: {},
    create: { name: 'TEST_ARMY', colorHex: '#000000' },
  });
  testArmyId = army.id;
});

afterAll(async () => {
  await app.close();
});

describe('Auth Routes (/v1/auth)', () => {
  const testPhone = '9998887776';
  let token: string;

  it('POST /login with new phone number should return is_new_user = true', async () => {
    // Clean up if it exists from a previous bad run
    await db.user.deleteMany({ where: { phoneNumber: testPhone } });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { phone: testPhone },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.is_new_user).toBe(true);
    expect(body.phone).toBe(testPhone);
    expect(body.token).toBeUndefined();
  });

  it('POST /onboard should create a new user and return a JWT', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/onboard',
      payload: {
        phone: testPhone,
        username: 'TestWarrior',
        armyId: testArmyId,
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.token).toBeDefined();
    expect(body.user.username).toBe('TestWarrior');
    expect(body.user.rank).toBe('Recruit');
    expect(body.user.army).toBe('TEST_ARMY');

    token = body.token; // Save for next tests
  });

  it('POST /login with existing phone should return is_new_user = false and JWT', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { phone: testPhone },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.is_new_user).toBe(false);
    expect(body.token).toBeDefined();
    expect(body.user.username).toBe('TestWarrior');
  });

  it('GET /me should return profile data when given a valid JWT', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.username).toBe('TestWarrior');
    expect(body.army.name).toBe('TEST_ARMY');
  });

  it('GET /me without token should return 401 Unauthorized', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
    });

    expect(response.statusCode).toBe(401);
  });
});
