// src/server.ts
// Fastify server setup

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { authRoutes } from './routes/auth.routes.js';
import { sessionsRoutes } from './routes/sessions.routes.js';
import { codeRoutes } from './routes/code.routes.js';

const fastify = Fastify({
    logger: true,
});

// Register plugins
await fastify.register(cors, {
    origin: true, // Allow all origins in development
    credentials: true,
});

await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
});

// Register routes
await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
await fastify.register(sessionsRoutes, { prefix: '/api/v1/sessions' });
await fastify.register(codeRoutes, { prefix: '/api/v1/code' });

// API base info
fastify.get('/api/v1', async () => {
    return {
        endpoints: {
            auth: '/api/v1/auth',
            sessions: '/api/v1/sessions',
            code: '/api/v1/code',
        },
        docs: 'See /openapi.yaml for full specification',
    };
});

// Health check
fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});

// Root route
fastify.get('/', async () => {
    return {
        name: 'Coding Interview Platform API',
        version: '1.0.0',
        docs: '/api/v1',
        health: '/health',
    };
});

// Start server
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3001', 10);
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`🚀 Server running at http://localhost:${port}`);
        console.log(`📚 API base: http://localhost:${port}/api/v1`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();

export { fastify };
