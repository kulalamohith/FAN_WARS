import { FastifyInstance } from 'fastify';
import { db } from '../../../lib/db.js';

export async function armiesRoutes(fastify: FastifyInstance) {
  // --- GET All Armies (/v1/armies) ---
  fastify.get('/', async (request, reply) => {
    try {
      const armies = await db.army.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          colorHex: true,
        }
      });
      return armies;
    } catch (error) {
      fastify.log.error(error);
      return reply.internalServerError('Failed to fetch armies');
    }
  });
}
