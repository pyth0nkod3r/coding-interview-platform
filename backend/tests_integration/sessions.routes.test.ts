import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildServer } from '../src/server.js';
import type { FastifyInstance } from 'fastify';

describe('Session Routes Integration', () => {
    let app: FastifyInstance;
    let interviewerToken: string;
    let candidateToken: string;

    beforeAll(async () => {
        app = await buildServer();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should setup users inside each test context', async () => {
        // This is just a placeholder if needed, but we do it in beforeEach below or in flow
    });

    beforeEach(async () => {
        const suffix = Math.random().toString(36).substring(7);
        // Create Interviewer
        const r1 = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/signup',
            payload: { username: `int_${suffix}`, email: `int_${suffix}@s.com`, password: 'password123', role: 'interviewer' }
        });
        interviewerToken = r1.json().token;

        // Create Candidate
        const r2 = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/signup',
            payload: { username: `cand_${suffix}`, email: `cand_${suffix}@s.com`, password: 'password123', role: 'candidate' }
        });
        candidateToken = r2.json().token;
    });

    it('should create a session as interviewer', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/sessions',
            headers: { Authorization: `Bearer ${interviewerToken}` }
        });

        expect(response.statusCode).toBe(201);
        const session = response.json();
        expect(session.id).toBeDefined();
        expect(session.status).toBe('active');
        // Store for next tests if we were splitting, but we'll create fresh if needed or rely on flow
        return session.id;
    });

    it('should fail to create session as candidate', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/sessions',
            headers: { Authorization: `Bearer ${candidateToken}` }
        });

        expect(response.statusCode).toBe(403);
    });

    it('should support full joining flow', async () => {
        // 1. Create
        const createRes = await app.inject({
            method: 'POST',
            url: '/api/v1/sessions',
            headers: { Authorization: `Bearer ${interviewerToken}` }
        });
        const sessionId = createRes.json().id;

        // 2. Join
        const joinRes = await app.inject({
            method: 'POST',
            url: `/api/v1/sessions/${sessionId}/join`,
            headers: { Authorization: `Bearer ${candidateToken}` }
        });
        expect(joinRes.statusCode).toBe(200);
        expect(joinRes.json().candidateId).toBeDefined();

        // 3. Add Question
        const qRes = await app.inject({
            method: 'POST',
            url: `/api/v1/sessions/${sessionId}/questions`,
            headers: { Authorization: `Bearer ${interviewerToken}` },
            payload: { title: 'Q1', content: 'Do generic tree traversal' }
        });
        expect(qRes.statusCode).toBe(201);

        // 4. Get Questions as Candidate
        const getQRes = await app.inject({
            method: 'GET',
            url: `/api/v1/sessions/${sessionId}/questions`,
            headers: { Authorization: `Bearer ${candidateToken}` }
        });
        expect(getQRes.statusCode).toBe(200);
        expect(getQRes.json()).toHaveLength(1);
    });
});
