/**
 * WARZONE — Auth Integration Tests (Native Node Runner)
 *
 * Replaces Vitest due to CJS/ESM module loading issues on Windows.
 * Uses native node:assert to verify the Fastify endpoints.
 */

import assert from 'node:assert';
import { buildApp } from '../src/app';
import { db } from '../src/lib/db';
import { FastifyInstance } from 'fastify';

async function runTests() {
  console.log('🚀 Starting Auth Integration Tests...');
  const app: FastifyInstance = await buildApp();
  await app.ready();

  try {
    // --- 0. Setup ---
    const testPhone = '9998887776';
    let token = '';

    const army = await db.army.upsert({
      where: { name: 'TEST_ARMY' },
      update: {},
      create: { name: 'TEST_ARMY', colorHex: '#000000' },
    });
    const testArmyId = army.id;

    // Clean previous run
    await db.user.deleteMany({ where: { phoneNumber: testPhone } });

    // --- 1. POST /login (New User) ---
    console.log('Test 1: POST /login (New User)');
    const res1 = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { phone: testPhone },
    });
    assert.strictEqual(res1.statusCode, 200, 'Login should return 200');
    const body1 = res1.json();
    assert.strictEqual(body1.is_new_user, true, 'Should flag as new user');
    assert.strictEqual(body1.token, undefined, 'Should not return JWT yet');

    // --- 2. POST /onboard ---
    console.log('Test 2: POST /onboard');
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/onboard',
      payload: {
        phone: testPhone,
        username: 'TestWarrior',
        armyId: testArmyId,
      },
    });
    assert.strictEqual(res2.statusCode, 201, 'Onboard should return 201');
    const body2 = res2.json();
    assert.ok(body2.token, 'Should return JWT');
    assert.strictEqual(body2.user.username, 'TestWarrior', 'Username should match');
    assert.strictEqual(body2.user.rank, 'Recruit', 'Rank should be Recruit');
    token = body2.token;

    // --- 3. POST /login (Existing User) ---
    console.log('Test 3: POST /login (Existing User)');
    const res3 = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { phone: testPhone },
    });
    assert.strictEqual(res3.statusCode, 200, 'Login should return 200');
    const body3 = res3.json();
    assert.strictEqual(body3.is_new_user, false, 'Should flag as returning user');
    assert.ok(body3.token, 'Should return JWT');

    // --- 4. GET /me (Valid Token) ---
    console.log('Test 4: GET /me (Valid Token)');
    const res4 = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(res4.statusCode, 200, 'Me should return 200');
    const body4 = res4.json();
    assert.strictEqual(body4.username, 'TestWarrior', 'Profile username should match');
    assert.strictEqual(body4.army.name, 'TEST_ARMY', 'Profile army should match');

    // --- 5. GET /me (No Token) ---
    console.log('Test 5: GET /me (No Token)');
    const res5 = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
    });
    assert.strictEqual(res5.statusCode, 401, 'Protected route should return 401');

    console.log('✅ All Auth tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
    await db.$disconnect();
  }
}

runTests();
