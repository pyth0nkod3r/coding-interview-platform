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
            const { username, password } = request.body;

            if (!username || !password) {
                return reply.status(400).send({ message: 'Username and password are required', code: 'BAD_REQUEST' });
            }

            const user = await AuthService.getUserByUsername(username);
            if (!user) {
                return reply.status(401).send({ message: 'Invalid username or password', code: 'UNAUTHORIZED' });
            }

            if (!AuthService.validatePassword(user, password)) {
                return reply.status(401).send({ message: 'Invalid username or password', code: 'UNAUTHORIZED' });
            }

            const token = fastify.jwt.sign({ id: user.id, username: user.username, role: user.role });
            // Don't send password back to client
            const { password: _, ...userWithoutPassword } = user;
            return { user: userWithoutPassword, token };
        }
    );

    // POST /auth/signup
    fastify.post<{ Body: SignupRequest }>(
        '/signup',
        async (request: FastifyRequest<{ Body: SignupRequest }>, reply: FastifyReply) => {
            const { username, email, password, role } = request.body;

            if (!username || !email || !password) {
                return reply.status(400).send({ message: 'Username, email, and password are required', code: 'BAD_REQUEST' });
            }

            if (password.length < 4) {
                return reply.status(400).send({ message: 'Password must be at least 4 characters', code: 'BAD_REQUEST' });
            }

            // Default to candidate if no role provided
            const userRole = role || 'candidate';

            if (userRole !== 'interviewer' && userRole !== 'candidate') {
                return reply.status(400).send({ message: 'Role must be interviewer or candidate', code: 'BAD_REQUEST' });
            }

            try {
                const user = await AuthService.createUser(username, email, password, userRole);
                const token = fastify.jwt.sign({ id: user.id, username: user.username, role: user.role });
                // Don't send password back to client
                const { password: _, ...userWithoutPassword } = user;
                return reply.status(201).send({ user: userWithoutPassword, token });
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
            const user = await AuthService.getUserById(request.user.id);
            if (!user) {
                return reply.status(404).send({ message: 'User not found', code: 'NOT_FOUND' });
            }
            return user;
        }
    );
}
