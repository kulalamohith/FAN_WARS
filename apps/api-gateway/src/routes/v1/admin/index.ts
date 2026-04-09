import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // Add authentication hook for all admin routes
  fastify.addHook('preValidation', fastify.verifyJWT);

  // POST /api/v1/admin/trigger-event
  const triggerEventSchema = z.object({
    matchId: z.string(),
    type: z.enum(['jinx', 'traitors', 'chaos']),
    data: z.any()
  });

  fastify.post('/trigger-event', async (request, reply) => {
    const reqUser = request.user as any;
    
    // Check if user is admin
    if (!reqUser.isAdmin && reqUser.id !== 'admin') {
      return reply.unauthorized('Admin access required');
    }

    const parsed = triggerEventSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid payload for admin event');
    }

    const { matchId, type, data } = parsed.data;

    // Use fastify.io to emit to the specific match room
    fastify.io.to(`room_${matchId}`).emit('admin_event', { type, data });

    fastify.log.info(`[ADMIN] Triggered ${type} event to room_${matchId}`);

    return reply.send({ success: true, message: `Event ${type} triggered on match ${matchId}` });
  });
};
