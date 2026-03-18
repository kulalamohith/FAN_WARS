/**
 * WARZONE — Auth Routes (/v1/auth)
 *
 * Handles login (Truecaller/OTP stubs) and new user onboarding.
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../../../lib/db';
import { calculateRank } from '../../../lib/ranks';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // --- 1. LOGIN STUB (/v1/auth/login) ---
  // In production, this verifies a Truecaller payload or sends an SMS OTP.
  // For Phase 1 / MVP, it accepts a phone number and either logs the user in,
  // or tells the client they need to onboard.

  const loginSchema = z.object({
    phone: z.string().min(10),
    auth_provider: z.enum(['truecaller', 'otp']).default('otp'),
  });

  fastify.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid login payload');
    }

    const { phone } = parsed.data;

    // Check if user exists
    const user = await db.user.findUnique({
      where: { phoneNumber: phone },
      include: { army: true },
    });

    if (!user) {
      // User doesn't exist. Tell client to route to Onboarding (Army Draft) screen.
      return reply.send({
        is_new_user: true,
        phone, // Client holds this in state for the onboard request
      });
    }

    // User exists. Calculate dynamic rank.
    const computedRank = calculateRank(user.totalWarPoints);

    // Generate JWT.
    const token = fastify.jwt.sign({
      id: user.id,
      username: user.username,
      armyId: user.armyId,
      rank: computedRank,
    });

    return reply.send({
      is_new_user: false,
      token,
      user: {
        id: user.id,
        username: user.username,
        rank: computedRank,
        army: user.army.name,
      },
    });
  });

  // --- 2. ONBOARD (/v1/auth/onboard) ---
  // Completes signup by submitting the chosen username and Army lock-in.

  const onboardSchema = z.object({
    phone: z.string().min(10),
    username: z.string().min(3).max(20),
    armyId: z.string(),
  });

  fastify.post('/onboard', async (request, reply) => {
    const parsed = onboardSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid onboard payload');
    }

    const { phone, username, armyId } = parsed.data;

    // Ensure phone/username aren't already taken
    const existing = await db.user.findFirst({
      where: {
        OR: [{ phoneNumber: phone }, { username: username }],
      },
    });

    if (existing) {
      return reply.conflict('Phone number or username already registered');
    }

    // Ensure chosen Army exists
    const army = await db.army.findUnique({ where: { name: armyId } });
    if (!army) {
      return reply.badRequest('Invalid Army selection. You cannot fight for a phantom army.');
    }

    // Create the User, locked to their Army
    const newUser = await db.user.create({
      data: {
        phoneNumber: phone,
        username,
        armyId: army.id,
        rank: 'Recruit',
      },
    });

    // Generate their first JWT
    const token = fastify.jwt.sign({
      id: newUser.id,
      username: newUser.username,
      armyId: newUser.armyId,
      rank: newUser.rank,
    });

    return reply.status(201).send({
      message: `Welcome to the ${army.name} Army`,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        rank: newUser.rank,
        army: army.name,
      },
    });
  });

  // --- 3. ME (/v1/auth/me) ---
  // Protected route to verify token and fetch current user profile

  fastify.get(
    '/me',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const user = await db.user.findUnique({
        where: { id: request.user.id },
        include: { army: true },
      });

      if (!user) {
        return reply.notFound('User not found');
      }

      const computedRank = calculateRank(user.totalWarPoints);

      return reply.send({
        id: user.id,
        username: user.username,
        rank: computedRank,
        totalWarPoints: user.totalWarPoints.toString(), // BigInt serialization safe
        army: {
          id: user.army.id,
          name: user.army.name,
          colorHex: user.army.colorHex,
        },
      });
    }
  );
};
