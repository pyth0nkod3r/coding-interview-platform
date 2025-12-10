// src/routes/code.routes.ts
// Code execution endpoints: /code/*

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CodeService } from '../services/code.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import type { ExecuteCodeRequest } from '../types/index.js';

export async function codeRoutes(fastify: FastifyInstance): Promise<void> {
    // POST /code/execute
    fastify.post<{ Body: ExecuteCodeRequest }>(
        '/execute',
        { preHandler: [authenticate] },
        async (request: FastifyRequest<{ Body: ExecuteCodeRequest }>, reply: FastifyReply) => {
            const { code, language } = request.body;

            if (!code || !language) {
                return reply.status(400).send({ message: 'Code and language are required', code: 'BAD_REQUEST' });
            }

            if (!['javascript', 'python', 'typescript'].includes(language)) {
                return reply.status(400).send({ message: 'Invalid language', code: 'BAD_REQUEST' });
            }

            const result = await CodeService.execute(code, language);
            return result;
        }
    );
}
