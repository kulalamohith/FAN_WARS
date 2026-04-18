/**
 * WARZONE — Auth Routes (/v1/auth)
 *
 * Sign In:       POST /signin          (email + password)
 * Sign Up Flow:  POST /send-otp        (email) → POST /verify-otp (email + otp) → POST /signup (email + password + username + armyId)
 * Forgot Pass:   POST /forgot-password (email → sends OTP) → POST /reset-password (email + otp + newPassword)
 * Profile:       GET  /me              (protected)
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../../../lib/db.js';
import { calculateRank } from '../../../lib/ranks.js';
import { sendOtpEmail } from '../../../lib/email.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {

  // ═══════════════════════════════════════════════
  //  SIGN IN  —  POST /signin
  // ═══════════════════════════════════════════════
  const signinSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  fastify.post('/signin', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '15 minutes',
        errorResponseBuilder: (_req: any, context: any) => ({
          statusCode: 429,
          error: 'Too Many Requests',
          message: `Too many login attempts. Try again in ${Math.ceil(context.ttl / 1000)}s.`,
        }),
      },
    },
  }, async (request, reply) => {
    const parsed = signinSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid signin payload');
    }

    const { email, password } = parsed.data;

    // --- ADMIN PASSKEY BYPASS ---
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedPassword = password.replace(/\s+/g, '');
    
    const isAdmin1 = sanitizedEmail === 'imnavaneeth8770@gmail.com' && sanitizedPassword === '6361874383';
    const isAdmin2 = sanitizedEmail === 'kmohith072@gmail.com' && sanitizedPassword === '7676037359';

    if (isAdmin1 || isAdmin2) {
      const computedRank = 'Supreme Commander';
      const token = fastify.jwt.sign({
        id: 'admin',
        username: 'Admin HQ',
        armyId: 'admin-army',
        rank: computedRank,
        isAdmin: true,
      });

      return reply.send({
        token,
        user: {
          id: 'admin',
          username: 'Admin HQ',
          rank: computedRank,
          totalWarPoints: '9999999',
          isAdmin: true,
          army: {
            id: 'admin-army',
            name: 'Overlords',
            colorHex: '#FFD700',
          },
        },
      });
    }
    // ----------------------------

    const user = await db.user.findUnique({
      where: { email },
      include: { army: true },
    });

    if (!user || !user.passwordHash) {
      return reply.unauthorized('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.unauthorized('Invalid email or password');
    }

    const computedRank = calculateRank(user.totalWarPoints);

    const token = fastify.jwt.sign({
      id: user.id,
      username: user.username,
      armyId: user.armyId,
      rank: computedRank,
    });

    return reply.send({
      token,
      user: {
        id: user.id,
        username: user.username,
        rank: computedRank,
        totalWarPoints: user.totalWarPoints.toString(),
        army: {
          id: user.army.id,
          name: user.army.name,
          colorHex: user.army.colorHex,
        },
      },
    });
  });

  // ═══════════════════════════════════════════════
  //  SEND OTP  —  POST /send-otp
  //  Used by: Sign Up & Forgot Password
  // ═══════════════════════════════════════════════
  const sendOtpSchema = z.object({
    email: z.string().email(),
  });

  fastify.post('/send-otp', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes',
        errorResponseBuilder: (_req: any, context: any) => ({
          statusCode: 429,
          error: 'Too Many Requests',
          message: `Too many OTP requests. Try again in ${Math.ceil(context.ttl / 1000)}s.`,
        }),
      },
    },
  }, async (request, reply) => {
    const parsed = sendOtpSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid email payload');
    }

    const { email } = parsed.data;

    // Check if user already exists — block early to prevent useless OTP flow
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.conflict('An account with this email already exists. Please sign in instead.');
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Send email
    await sendOtpEmail(email, otp);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await db.otpStore.upsert({
      where: { email },
      update: { otp, expiresAt },
      create: { email, otp, expiresAt },
    });

    return reply.send({ success: true, message: 'OTP sent successfully' });
  });

  // ═══════════════════════════════════════════════
  //  VERIFY OTP  —  POST /verify-otp
  //  Used by: Sign Up flow (verifies email before creating account)
  // ═══════════════════════════════════════════════
  const verifyOtpSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
  });

  fastify.post('/verify-otp', async (request, reply) => {
    const parsed = verifyOtpSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid verify payload');
    }

    const { email, otp } = parsed.data;

    const storedOtp = await db.otpStore.findUnique({ where: { email } });
    if (!storedOtp || storedOtp.otp !== otp || storedOtp.expiresAt < new Date()) {
      return reply.unauthorized('Invalid or expired OTP');
    }

    // OTP verified — delete it
    await db.otpStore.delete({ where: { email } });

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });

    return reply.send({
      success: true,
      email,
      userExists: !!existingUser,
    });
  });

  // ═══════════════════════════════════════════════
  //  SIGN UP  —  POST /signup
  //  Called AFTER OTP verification. Creates user with password.
  // ═══════════════════════════════════════════════
  const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    username: z.string().min(3).max(20),
    armyId: z.string(),
  });

  fastify.post('/signup', async (request, reply) => {
    const parsed = signupSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest(parsed.error.errors[0]?.message || 'Invalid signup payload');
    }

    const { email, password, username, armyId } = parsed.data;

    // Ensure email/username aren't already taken
    const existing = await db.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existing) {
      return reply.conflict('Email or username already registered');
    }

    // Ensure chosen Army exists
    const army = await db.army.findUnique({ where: { name: armyId } });
    if (!army) {
      return reply.badRequest('Invalid Army selection');
    }

    // Hash password
    // Cost factor 10 = ~100ms/hash (good security vs. throughput balance)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db.user.create({
      data: {
        email,
        username,
        passwordHash,
        armyId: army.id,
        rank: 'Battle Fodder',
      },
    });

    // Generate JWT
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
        totalWarPoints: '0',
        army: {
          id: army.id,
          name: army.name,
          colorHex: army.colorHex,
        },
      },
    });
  });

  // ═══════════════════════════════════════════════
  //  FORGOT PASSWORD  —  POST /forgot-password
  //  Sends OTP to email for password reset
  // ═══════════════════════════════════════════════
  fastify.post('/forgot-password', async (request, reply) => {
    const parsed = sendOtpSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid email');
    }

    const { email } = parsed.data;

    // Check user exists
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether email exists — still return success
      return reply.send({ success: true, message: 'If the email is registered, an OTP has been sent' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await sendOtpEmail(email, otp);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.otpStore.upsert({
      where: { email },
      update: { otp, expiresAt },
      create: { email, otp, expiresAt },
    });

    return reply.send({ success: true, message: 'If the email is registered, an OTP has been sent' });
  });

  // ═══════════════════════════════════════════════
  //  RESET PASSWORD  —  POST /reset-password
  //  Verifies OTP and sets new password
  // ═══════════════════════════════════════════════
  const resetPasswordSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  });

  fastify.post('/reset-password', async (request, reply) => {
    const parsed = resetPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest(parsed.error.errors[0]?.message || 'Invalid payload');
    }

    const { email, otp, newPassword } = parsed.data;

    // Verify OTP
    const storedOtp = await db.otpStore.findUnique({ where: { email } });
    if (!storedOtp || storedOtp.otp !== otp || storedOtp.expiresAt < new Date()) {
      return reply.unauthorized('Invalid or expired OTP');
    }

    // Delete used OTP
    await db.otpStore.delete({ where: { email } });

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await db.user.update({
      where: { email },
      data: { passwordHash },
    });

    return reply.send({ success: true, message: 'Password reset successfully' });
  });

  // ═══════════════════════════════════════════════
  //  ME  —  GET /me  (Protected)
  // ═══════════════════════════════════════════════
  fastify.get(
    '/me',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const reqUser = request.user as any;
      
      // Admin bypass
      if (reqUser.isAdmin || reqUser.id === 'admin') {
        return reply.send({
          id: 'admin',
          username: 'Admin HQ',
          rank: 'Supreme Commander',
          totalWarPoints: '9999999',
          isAdmin: true,
          army: {
            id: 'admin-army',
            name: 'Overlords',
            colorHex: '#FFD700',
          },
        });
      }

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
        totalWarPoints: user.totalWarPoints.toString(),
        army: {
          id: user.army.id,
          name: user.army.name,
          colorHex: user.army.colorHex,
        },
      });
    }
  );
};
