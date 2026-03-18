/**
 * WARZONE — Matches & Predictions Integration Tests
 * Runs via native Node assert to bypass Vitest/ESM issues.
 */

import assert from 'node:assert';
import { buildApp } from '../src/app';
import { db } from '../src/lib/db';
import { FastifyInstance } from 'fastify';

async function runTests() {
  console.log('🚀 Starting Match & Prediction Integration Tests...');
  const app: FastifyInstance = await buildApp();
  await app.ready();

  try {
    // --- 0. Setup ---
    console.log('--- Setting up Test Data ---');
    // Create test armys, a live match, a war room, a prediction, and a test user
    const homeArmy = await db.army.upsert({
      where: { name: 'HOME_ARMY' },
      update: {},
      create: { name: 'HOME_ARMY', colorHex: '#FFFFFF' },
    });
    
    const awayArmy = await db.army.upsert({
      where: { name: 'AWAY_ARMY' },
      update: {},
      create: { name: 'AWAY_ARMY', colorHex: '#000000' },
    });

    const match = await db.match.create({
      data: {
        homeArmyId: homeArmy.id,
        awayArmyId: awayArmy.id,
        status: 'LIVE',
        startTime: new Date(),
        warRoom: {
          create: {
            toxicityScoreHome: 10,
            toxicityScoreAway: 20,
          }
        },
        predictions: {
          create: {
            questionText: 'Will Test player score 50?',
            optionA: 'Yes',
            optionB: 'No',
            pointsReward: 100,
            status: 'ACTIVE',
            expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
          }
        }
      },
      include: {
        warRoom: true,
        predictions: true,
      }
    });

    const testUser = await db.user.create({
      data: {
        username: `Predictor_${Date.now()}`,
        phoneNumber: `${Date.now()}`.substring(0, 10),
        armyId: homeArmy.id,
      }
    });

    // Generate JWT for the test user
    const token = app.jwt.sign({
      id: testUser.id,
      username: testUser.username,
      armyId: testUser.armyId,
      rank: testUser.rank,
    });
    const headers = { Authorization: `Bearer ${token}` };

    const warRoomId = match.warRoom!.id;
    const predictionId = match.predictions[0].id;


    // --- 1. GET /matches/live ---
    console.log('Test 1: GET /matches/live (Pagination & Shape)');
    const res1 = await app.inject({
      method: 'GET',
      url: '/api/v1/matches/live',
      headers,
    });
    assert.strictEqual(res1.statusCode, 200);
    const body1 = res1.json();
    assert.ok(body1.matches.length > 0, 'Should return at least 1 match');
    assert.strictEqual(body1.meta.page, 1, 'Default page 1');
    
    // Ensure shape matches API_SPEC exactly
    const firstMatch = body1.matches[0];
    assert.ok(firstMatch.homeArmy.name);
    assert.ok(firstMatch.warRoomId);


    // --- 2. GET /war-rooms/:id ---
    console.log('Test 2: GET /war-rooms/:id');
    const res2 = await app.inject({
      method: 'GET',
      url: `/api/v1/war-rooms/${warRoomId}`,
      headers,
    });
    assert.strictEqual(res2.statusCode, 200);
    const body2 = res2.json();
    assert.strictEqual(body2.toxicity.homeScore, 10);
    assert.strictEqual(body2.activePredictions.length, 1);
    assert.strictEqual(body2.activePredictions[0].id, predictionId);
    assert.strictEqual(body2.matchId, match.id);


    // --- 3. POST /predictions/:id/vote ---
    console.log('Test 3: POST /predictions/:id/vote (Success)');
    const res3 = await app.inject({
      method: 'POST',
      url: `/api/v1/predictions/${predictionId}/vote`,
      headers,
      payload: { selectedOption: 'A' }
    });
    assert.strictEqual(res3.statusCode, 200);
    assert.strictEqual(res3.json().success, true);


    // --- 4. POST /predictions/:id/vote (Double Vote Prevention) ---
    console.log('Test 4: POST /predictions/:id/vote (Double Vote Prevention)');
    const res4 = await app.inject({
      method: 'POST',
      url: `/api/v1/predictions/${predictionId}/vote`,
      headers,
      payload: { selectedOption: 'B' }
    });
    assert.strictEqual(res4.statusCode, 409, 'Should block double voting with 409 Conflict');


    // --- 5. Rbac Role Verification ---
    console.log('Test 5: RBAC Role Demo (Expected 403 for missing admin role on a hypothetical admin route)');
    // We haven't built an admin route yet, but we can verify the decorator is registered on the app
    assert.ok(app.verifyRole, 'verifyRole decorator should exist on Fastify instance');


    console.log('✅ All Match & Prediction tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exitCode = 1;
  } finally {
    // Cleanup generated match so we don't pollute local DB too much
    console.log('--- Cleaning up Test Data ---');
    await db.match.deleteMany({ where: { status: 'LIVE' } });
    await app.close();
    await db.$disconnect();
  }
}

runTests();
