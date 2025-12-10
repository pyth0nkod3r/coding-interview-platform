// src/routes/auth.routes.ts
// Authentication endpoints: /auth/*

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import type { LoginRequest, SignupRequest } from '../types/index.js';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
    // POST /auth/login
    fastify.post<{ Body: LoginRequest }>(
        '/login',
        async (request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) => {
            const { username } = request.body;

            if (!username) {
                return reply.status(400).send({ message: 'Username is required', code: 'BAD_REQUEST' });
            }

            const user = AuthService.getUserByUsername(username);
            if (!user) {
                return reply.status(401).send({ message: 'User not found. Please sign up.', code: 'USER_NOT_FOUND' });
            }

            const token = fastify.jwt.sign({ id: user.id, username: user.username, role: user.role });
            return { user, token };
        }
    );

    // POST /auth/signup
    fastify.post<{ Body: SignupRequest }>(
        '/signup',
        async (request: FastifyRequest<{ Body: SignupRequest }>, reply: FastifyReply) => {
            const { username, email, role } = request.body;

            if (!username || !email || !role) {
                return reply.status(400).send({ message: 'Username, email, and role are required', code: 'BAD_REQUEST' });
            }

            if (role !== 'interviewer' && role !== 'candidate') {
                return reply.status(400).send({ message: 'Role must be interviewer or candidate', code: 'BAD_REQUEST' });
            }

            try {
                const user = AuthService.createUser(username, email, role);
                const token = fastify.jwt.sign({ id: user.id, username: user.username, role: user.role });
                return reply.status(201).send({ user, token });
            } catch (error) {
                return reply.status(400).send({
                    message: error instanceof Error ? error.message : 'Signup failed',
                    code: 'SIGNUP_FAILED'
                });
            }
        }
    );

    // POST /auth/logout
    fastify.post(
        '/logout',
        { preHandler: [authenticate] },
        async (_request: FastifyRequest, reply: FastifyReply) => {
            // For JWT, logout is handled client-side by removing the token
            // Server-side token blacklisting would be added for production
            return reply.status(204).send();
        }
    );

    // GET /auth/me
    fastify.get(
        '/me',
        { preHandler: [authenticate] },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const user = AuthService.getUserById(request.user.id);
            if (!user) {
                return reply.status(404).send({ message: 'User not found', code: 'NOT_FOUND' });
            }
            return user;
        }
    );
}
