// src/server.ts
// Fastify server setup with Swagger UI

import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { fileURLToPath } from 'node:url';
import { authRoutes } from './routes/auth.routes.js';
import { sessionsRoutes } from './routes/sessions.routes.js';
import { codeRoutes } from './routes/code.routes.js';

export async function buildServer(): Promise<FastifyInstance> {
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

    // Swagger configuration
    await fastify.register(swagger, {
        openapi: {
            info: {
                title: 'Coding Interview Platform API',
                description: 'Backend API for the Coding Interview Platform',
                version: '1.0.0',
            },
            servers: [
                { url: 'http://localhost:3001', description: 'Development server' },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
        },
    });

    await fastify.register(swaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
        },
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
            docs: '/docs',
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
            docs: '/docs',
            api: '/api/v1',
            health: '/health',
        };
    });

    return fastify;
}

// Start server with port fallback
const start = async () => {
    const fastify = await buildServer();
    const basePort = parseInt(process.env.BACKEND_PORT || process.env.PORT || '3001', 10);
    const maxRetries = 10;

    for (let i = 0; i < maxRetries; i++) {
        const port = basePort + i;
        try {
            await fastify.listen({ port, host: '0.0.0.0' });
            console.log(`🚀 Server running at http://localhost:${port}`);
            console.log(`📚 API docs: http://localhost:${port}/docs`);
            console.log(`📚 API base: http://localhost:${port}/api/v1`);
            return;
        } catch (err: unknown) {
            if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
                console.log(`⚠️  Port ${port} in use, trying ${port + 1}...`);
                continue;
            }
            fastify.log.error(err);
            process.exit(1);
        }
    }

    console.error(`❌ Could not find an available port after ${maxRetries} attempts`);
    process.exit(1);
};

// Check if file is run directly
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
    start();
}

