import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server.js';
import type { FastifyInstance } from 'fastify';

describe('Auth Routes Integration', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = await buildServer();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/auth/signup', () => {
        it('should register a new user', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/auth/signup',
                payload: {
                    username: 'test_int_user',
                    email: 'test_int@example.com',
                    password: 'password123',
                    role: 'candidate'
                }
            });

            expect(response.statusCode).toBe(201);
            const body = response.json();
            expect(body.user.username).toBe('test_int_user');
            expect(body.token).toBeDefined();
            expect(body.user.password).toBeUndefined();
        });

        it('should fail with existing username', async () => {
            // First create
            await app.inject({
                method: 'POST',
                url: '/api/v1/auth/signup',
                payload: {
                    username: 'test_dup',
                    email: 'dup@example.com',
                    password: 'password123',
                    role: 'candidate'
                }
            });

            // Try duplicate
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/auth/signup',
                payload: {
                    username: 'test_dup',
                    email: 'dup2@example.com',
                    password: 'password123',
                    role: 'candidate'
                }
            });

            expect(response.statusCode).toBe(400);
            expect(response.json().code).toBe('SIGNUP_FAILED');
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login successfully', async () => {
            // Setup user
            await app.inject({
                method: 'POST',
                url: '/api/v1/auth/signup',
                payload: {
                    username: 'test_login',
                    email: 'login@example.com',
                    password: 'password123',
                    role: 'candidate'
                }
            });

            // Login
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/auth/login',
                payload: {
                    username: 'test_login',
                    password: 'password123'
                }
            });

            expect(response.statusCode).toBe(200);
            expect(response.json().token).toBeDefined();
        });

        it('should fail with invalid credentials', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/auth/login',
                payload: {
                    username: 'nonexistent',
                    password: 'password123'
                }
            });

            expect(response.statusCode).toBe(401);
        });
    });
});
