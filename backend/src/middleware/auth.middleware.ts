// src/middleware/auth.middleware.ts
// JWT authentication middleware

import type { FastifyRequest, FastifyReply } from 'fastify';

export async function authenticate(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.status(401).send({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
    }
}
