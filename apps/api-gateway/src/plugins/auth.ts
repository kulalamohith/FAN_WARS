/**
 * WARZONE — Authentication Plugin
 *
 * Configures @fastify/jwt and provides a `verifyJWT` hook
 * that can be attached to protected routes.
 */

import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { config } from '../config';
import { db } from '../lib/db';
import { FastifyReply, FastifyRequest } from 'fastify';

// Using FastifyJWT interface to properly type request.user
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string;
      username: string;
      armyId: string;
      rank: string;
      isAdmin?: boolean;
    };
    user: {
      id: string;
      username: string;
      armyId: string;
      rank: string;
      isAdmin?: boolean;
    };
  }
}

export default fp(async (fastify) => {
  // Register JWT provider
  await fastify.register(fastifyJwt, {
    secret: config.JWT_SECRET,
    sign: {
      expiresIn: config.JWT_EXPIRES_IN,
    },
  });

  // Decorator to protect routes (Authentication only)
  fastify.decorate(
    'verifyJWT',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        console.log("DECODED JWT USER:", request.user);

        // Bypass DB validation for mocked Admin credentials
        if (request.user.id === 'admin' || (request.user as any).isAdmin === true) {
          return;
        }

        const userExists = await db.user.findUnique({
          where: { id: request.user.id }
        });
        if (!userExists || userExists.deletedAt) {
          return reply.unauthorized('User session invalid or user deleted.');
        }
      } catch (err) {
        reply.unauthorized('Invalid or missing authentication token');
      }
    }
  );

  // Decorator to protect routes and enforce roles (Auth + RBAC)
  fastify.decorate(
    'verifyRole',
    (allowedRoles: string[]) => {
      return async (request: FastifyRequest, reply: FastifyReply) => {
        // First verify JWT
        try {
          await request.jwtVerify();
        } catch (err) {
          return reply.unauthorized('Invalid or missing authentication token');
        }

        // Then verify Role
        if (!request.user || !allowedRoles.includes(request.user.rank)) {
          return reply.forbidden('Insufficient permissions for this action');
        }
      };
    }
  );
});

// Also define the exported type for the decorator so routes can use it easily
declare module 'fastify' {
  interface FastifyInstance {
    verifyJWT: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
    verifyRole: (
      allowedRoles: string[]
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
