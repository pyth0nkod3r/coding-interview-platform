// src/routes/sessions.routes.ts
// Session endpoints: /sessions/*

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SessionService } from '../services/session.service.js';
import { AuthService } from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import type {
    AddQuestionRequest,
    UpdateQuestionRequest,
    SendMessageRequest,
    UpdateNotesRequest,
    SessionUpdateRequest
} from '../types/index.js';

interface SessionParams {
    sessionId: string;
}

interface QuestionParams extends SessionParams {
    questionId: string;
}

interface MessagesQuery {
    since?: string;
}

export async function sessionsRoutes(fastify: FastifyInstance): Promise<void> {
    // All session routes require authentication
    fastify.addHook('preHandler', authenticate);

    // ============================================
    // Session CRUD
    // ============================================

    // POST /sessions - Create session
    fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
        const user = await AuthService.getUserById(request.user.id);
        if (!user) {
            return reply.status(401).send({ message: 'User not found', code: 'UNAUTHORIZED' });
        }

        try {
            const session = await SessionService.createSession(user);
            return reply.status(201).send(session);
        } catch (error) {
            return reply.status(403).send({
                message: error instanceof Error ? error.message : 'Failed to create session',
                code: 'FORBIDDEN'
            });
        }
    });

    // GET /sessions - Get all sessions
    fastify.get('/', async (request: FastifyRequest) => {
        return await SessionService.getSessionsByUser(request.user.id);
    });

    // GET /sessions/:sessionId
    fastify.get<{ Params: SessionParams }>(
        '/:sessionId',
        async (request: FastifyRequest<{ Params: SessionParams }>, reply: FastifyReply) => {
            const session = await SessionService.getSession(request.params.sessionId);
            if (!session) {
                return reply.status(404).send({ message: 'Session not found', code: 'NOT_FOUND' });
            }
            return session;
        }
    );

    // PATCH /sessions/:sessionId
    fastify.patch<{ Params: SessionParams; Body: SessionUpdateRequest }>(
        '/:sessionId',
        async (request: FastifyRequest<{ Params: SessionParams; Body: SessionUpdateRequest }>, reply: FastifyReply) => {
            const { codeState, permissions } = request.body;

            try {
                const session = await SessionService.updateSession(request.params.sessionId, { codeState, permissions });
                if (!session) {
                    return reply.status(404).send({ message: 'Session not found', code: 'NOT_FOUND' });
                }
                return session;
            } catch (error) {
                return reply.status(400).send({
                    message: error instanceof Error ? error.message : 'Update failed',
                    code: 'BAD_REQUEST'
                });
            }
        }
    );

    // POST /sessions/:sessionId/join
    fastify.post<{ Params: SessionParams }>(
        '/:sessionId/join',
        async (request: FastifyRequest<{ Params: SessionParams }>, reply: FastifyReply) => {
            try {
                const session = await SessionService.joinSession(request.params.sessionId, request.user.id);
                return session;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Join failed';
                if (message.includes('not found')) {
                    return reply.status(404).send({ message, code: 'NOT_FOUND' });
                }
                return reply.status(409).send({ message, code: 'CONFLICT' });
            }
        }
    );

    // POST /sessions/:sessionId/end
    fastify.post<{ Params: SessionParams }>(
        '/:sessionId/end',
        async (request: FastifyRequest<{ Params: SessionParams }>, reply: FastifyReply) => {
            try {
                const session = await SessionService.endSession(request.params.sessionId, request.user.id);
                return session;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'End failed';
                if (message.includes('not found')) {
                    return reply.status(404).send({ message, code: 'NOT_FOUND' });
                }
                return reply.status(403).send({ message, code: 'FORBIDDEN' });
            }
        }
    );

    // ============================================
    // Permissions
    // ============================================

    // POST /sessions/:sessionId/permissions/typing
    fastify.post<{ Params: SessionParams }>(
        '/:sessionId/permissions/typing',
        async (request: FastifyRequest<{ Params: SessionParams }>, reply: FastifyReply) => {
            try {
                const canCandidateType = await SessionService.toggleCandidateTyping(
                    request.params.sessionId,
                    request.user.id
                );
                return { canCandidateType };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Toggle failed';
                if (message.includes('not found')) {
                    return reply.status(404).send({ message, code: 'NOT_FOUND' });
                }
                return reply.status(403).send({ message, code: 'FORBIDDEN' });
            }
        }
    );

    // POST /sessions/:sessionId/permissions/run
    fastify.post<{ Params: SessionParams }>(
        '/:sessionId/permissions/run',
        async (request: FastifyRequest<{ Params: SessionParams }>, reply: FastifyReply) => {
            try {
                const canCandidateRun = await SessionService.toggleCandidateRun(
                    request.params.sessionId,
                    request.user.id
                );
                return { canCandidateRun };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Toggle failed';
                if (message.includes('not found')) {
                    return reply.status(404).send({ message, code: 'NOT_FOUND' });
                }
                return reply.status(403).send({ message, code: 'FORBIDDEN' });
            }
        }
    );

    // ============================================
    // Questions
    // ============================================

    // GET /sessions/:sessionId/questions
    fastify.get<{ Params: SessionParams }>(
        '/:sessionId/questions',
        async (request: FastifyRequest<{ Params: SessionParams }>, reply: FastifyReply) => {
            const session = await SessionService.getSession(request.params.sessionId);
            if (!session) {
                return reply.status(404).send({ message: 'Session not found', code: 'NOT_FOUND' });
            }
            return session.questions;
        }
    );

    // POST /sessions/:sessionId/questions
    fastify.post<{ Params: SessionParams; Body: AddQuestionRequest }>(
        '/:sessionId/questions',
        async (request: FastifyRequest<{ Params: SessionParams; Body: AddQuestionRequest }>, reply: FastifyReply) => {
            const { title, content } = request.body;

            if (!title || !content) {
                return reply.status(400).send({ message: 'Title and content are required', code: 'BAD_REQUEST' });
            }

            try {
                const question = await SessionService.addQuestion(
                    request.params.sessionId,
                    request.user.id,
                    title,
                    content
                );
                return reply.status(201).send(question);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Add question failed';
                if (message.includes('not found')) {
                    return reply.status(404).send({ message, code: 'NOT_FOUND' });
                }
                return reply.status(403).send({ message, code: 'FORBIDDEN' });
            }
        }
    );

    // PUT /sessions/:sessionId/questions/:questionId
    fastify.put<{ Params: QuestionParams; Body: UpdateQuestionRequest }>(
        '/:sessionId/questions/:questionId',
        async (request: FastifyRequest<{ Params: QuestionParams; Body: UpdateQuestionRequest }>, reply: FastifyReply) => {
            const { title, content } = request.body;

            if (!title || !content) {
                return reply.status(400).send({ message: 'Title and content are required', code: 'BAD_REQUEST' });
            }

            try {
                const question = await SessionService.updateQuestion(
                    request.params.sessionId,
                    request.user.id,
                    request.params.questionId,
                    title,
                    content
                );
                return question;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Update question failed';
                if (message.includes('not found')) {
                    return reply.status(404).send({ message, code: 'NOT_FOUND' });
                }
                return reply.status(403).send({ message, code: 'FORBIDDEN' });
            }
        }
    );

    // DELETE /sessions/:sessionId/questions/:questionId
    fastify.delete<{ Params: QuestionParams }>(
        '/:sessionId/questions/:questionId',
        async (request: FastifyRequest<{ Params: QuestionParams }>, reply: FastifyReply) => {
            try {
                await SessionService.removeQuestion(
                    request.params.sessionId,
                    request.user.id,
                    request.params.questionId
                );
                return reply.status(204).send();
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Remove question failed';
                if (message.includes('not found')) {
                    return reply.status(404).send({ message, code: 'NOT_FOUND' });
                }
                return reply.status(403).send({ message, code: 'FORBIDDEN' });
            }
        }
    );

    // ============================================
    // Messages
    // ============================================

    // GET /sessions/:sessionId/messages
    fastify.get<{ Params: SessionParams; Querystring: MessagesQuery }>(
        '/:sessionId/messages',
        async (request: FastifyRequest<{ Params: SessionParams; Querystring: MessagesQuery }>, reply: FastifyReply) => {
            const since = request.query.since ? parseInt(request.query.since, 10) : undefined;

            try {
                return await SessionService.getMessages(request.params.sessionId, since);
            } catch (error) {
                return reply.status(404).send({ message: 'Session not found', code: 'NOT_FOUND' });
            }
        }
    );

    // POST /sessions/:sessionId/messages
    fastify.post<{ Params: SessionParams; Body: SendMessageRequest }>(
        '/:sessionId/messages',
        async (request: FastifyRequest<{ Params: SessionParams; Body: SendMessageRequest }>, reply: FastifyReply) => {
            const { content } = request.body;

            if (!content) {
                return reply.status(400).send({ message: 'Content is required', code: 'BAD_REQUEST' });
            }

            const user = await AuthService.getUserById(request.user.id);
            if (!user) {
                return reply.status(401).send({ message: 'User not found', code: 'UNAUTHORIZED' });
            }

            try {
                const message = await SessionService.addMessage(request.params.sessionId, user, content);
                return reply.status(201).send(message);
            } catch (error) {
                return reply.status(404).send({ message: 'Session not found', code: 'NOT_FOUND' });
            }
        }
    );

    // ============================================
    // Notes
    // ============================================

    // GET /sessions/:sessionId/notes
    fastify.get<{ Params: SessionParams }>(
        '/:sessionId/notes',
        async (request: FastifyRequest<{ Params: SessionParams }>, reply: FastifyReply) => {
            try {
                const notes = await SessionService.getUserNotes(request.params.sessionId, request.user.id);
                return { notes };
            } catch (error) {
                return reply.status(404).send({ message: 'Session not found', code: 'NOT_FOUND' });
            }
        }
    );

    // PUT /sessions/:sessionId/notes
    fastify.put<{ Params: SessionParams; Body: UpdateNotesRequest }>(
        '/:sessionId/notes',
        async (request: FastifyRequest<{ Params: SessionParams; Body: UpdateNotesRequest }>, reply: FastifyReply) => {
            const { notes } = request.body;

            if (notes === undefined) {
                return reply.status(400).send({ message: 'Notes field is required', code: 'BAD_REQUEST' });
            }

            try {
                const updatedNotes = await SessionService.updateUserNotes(
                    request.params.sessionId,
                    request.user.id,
                    notes
                );
                return { notes: updatedNotes };
            } catch (error) {
                return reply.status(404).send({ message: 'Session not found', code: 'NOT_FOUND' });
            }
        }
    );
}
