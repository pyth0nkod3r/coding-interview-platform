// src/services/session.service.ts
// Session management business logic

import { prisma } from '../db/prisma.js';
import type {
    InterviewSession,
    User,
    Question,
    Message,
    CodeState,
    Permissions,
    SessionStatus,
    Language,
    UserRole
} from '../types/index.js';

export class SessionService {
    // Helper to map Prisma session to domain Session
    private static mapToSession(pSession: any): InterviewSession {
        const privateNotes: Record<string, string> = {};
        if (pSession.notes) {
            pSession.notes.forEach((n: any) => {
                privateNotes[n.userId] = n.content;
            });
        }

        return {
            id: pSession.id,
            interviewerId: pSession.interviewerId,
            candidateId: pSession.candidateId || undefined,
            createdAt: pSession.createdAt.getTime(),
            status: pSession.status as SessionStatus,
            questions: pSession.questions?.map((q: any) => ({
                id: q.id,
                title: q.title,
                content: q.content,
                createdAt: q.createdAt.getTime()
            })) || [],
            codeState: {
                code: pSession.code,
                language: pSession.language as Language,
            },
            permissions: {
                canCandidateRun: pSession.canCandidateRun,
                canCandidateType: pSession.canCandidateType,
                canRequestVideo: pSession.canRequestVideo ?? true
            },
            privateNotes,
            sharedMessages: pSession.messages?.map((m: any) => ({
                id: m.id,
                senderId: m.senderId,
                senderRole: m.sender.role as UserRole,
                senderName: m.sender.username,
                content: m.content,
                timestamp: m.timestamp.getTime()
            })) || []
        };
    }

    private static includeOptions = {
        questions: { orderBy: { createdAt: 'asc' as const } },
        messages: {
            include: { sender: true },
            orderBy: { timestamp: 'asc' as const }
        },
        notes: true
    };

    static async createSession(interviewer: User): Promise<InterviewSession> {
        if (interviewer.role !== 'interviewer') {
            throw new Error('Only interviewers can create sessions');
        }

        const session = await prisma.session.create({
            data: {
                interviewerId: interviewer.id,
                status: 'active',
                code: '// Start coding here...',
                language: 'javascript',
                canCandidateRun: true,
                canCandidateType: true,
                canRequestVideo: true,
            },
            include: SessionService.includeOptions
        });

        return SessionService.mapToSession(session);
    }

    static async getSession(id: string): Promise<InterviewSession | null> {
        const session = await prisma.session.findUnique({
            where: { id },
            include: SessionService.includeOptions
        });
        if (!session) return null;
        return SessionService.mapToSession(session);
    }

    static async getSessionsByUser(userId: string): Promise<InterviewSession[]> {
        const sessions = await prisma.session.findMany({
            where: {
                OR: [
                    { interviewerId: userId },
                    { candidateId: userId }
                ]
            },
            include: SessionService.includeOptions,
            orderBy: { createdAt: 'desc' as const }
        });
        return sessions.map(SessionService.mapToSession);
    }

    static async getAllSessions(): Promise<InterviewSession[]> {
        const sessions = await prisma.session.findMany({
            include: SessionService.includeOptions,
            orderBy: { createdAt: 'desc' as const }
        });
        return sessions.map(SessionService.mapToSession);
    }

    static async updateSession(
        id: string,
        updates: { codeState?: CodeState; permissions?: Permissions }
    ): Promise<InterviewSession | null> {
        const data: any = {};
        if (updates.codeState) {
            data.code = updates.codeState.code;
            data.language = updates.codeState.language;
        }
        if (updates.permissions) {
            data.canCandidateRun = updates.permissions.canCandidateRun;
            data.canCandidateType = updates.permissions.canCandidateType;
            if (updates.permissions.canRequestVideo !== undefined) {
                data.canRequestVideo = updates.permissions.canRequestVideo;
            }
        }

        try {
            const session = await prisma.session.update({
                where: { id },
                data,
                include: SessionService.includeOptions
            });
            return SessionService.mapToSession(session);
        } catch (e) {
            return null;
        }
    }

    static async joinSession(sessionId: string, candidateId: string): Promise<InterviewSession> {
        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session) {
            throw new Error('Session not found');
        }
        if (session.status === 'ended') {
            throw new Error('Session has ended');
        }
        if (session.candidateId && session.candidateId !== candidateId) {
            throw new Error('Session already has a candidate');
        }

        const updated = await prisma.session.update({
            where: { id: sessionId },
            data: { candidateId },
            include: SessionService.includeOptions
        });
        return SessionService.mapToSession(updated);
    }

    static async endSession(sessionId: string, userId: string): Promise<InterviewSession> {
        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session) {
            throw new Error('Session not found');
        }
        if (session.interviewerId !== userId) {
            throw new Error('Only interviewer can end session');
        }

        const updated = await prisma.session.update({
            where: { id: sessionId },
            data: { status: 'ended' },
            include: SessionService.includeOptions
        });
        return SessionService.mapToSession(updated);
    }

    // ============================================
    // Permissions
    // ============================================

    static async toggleCandidateTyping(sessionId: string, userId: string): Promise<boolean> {
        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session) throw new Error('Session not found');
        if (session.interviewerId !== userId) {
            throw new Error('Only interviewer can change permissions');
        }

        const newValue = !session.canCandidateType;
        await prisma.session.update({
            where: { id: sessionId },
            data: { canCandidateType: newValue }
        });
        return newValue;
    }

    static async toggleCandidateRun(sessionId: string, userId: string): Promise<boolean> {
        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session) throw new Error('Session not found');
        if (session.interviewerId !== userId) {
            throw new Error('Only interviewer can change permissions');
        }

        const newValue = !session.canCandidateRun;
        await prisma.session.update({
            where: { id: sessionId },
            data: { canCandidateRun: newValue }
        });
        return newValue;
    }

    // ============================================
    // Questions
    // ============================================

    static async addQuestion(sessionId: string, userId: string, title: string, content: string): Promise<Question> {
        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session) throw new Error('Session not found');
        if (session.interviewerId !== userId) {
            throw new Error('Only interviewer can add questions');
        }

        const question = await prisma.question.create({
            data: {
                sessionId,
                title,
                content
            }
        });

        return {
            id: question.id,
            title: question.title,
            content: question.content,
            createdAt: question.createdAt.getTime()
        };
    }

    static async updateQuestion(
        sessionId: string,
        userId: string,
        questionId: string,
        title: string,
        content: string
    ): Promise<Question> {
        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session) throw new Error('Session not found');
        if (session.interviewerId !== userId) {
            throw new Error('Only interviewer can update questions');
        }

        // Verify question exists in this session
        const question = await prisma.question.findFirst({
            where: { id: questionId, sessionId }
        });
        if (!question) throw new Error('Question not found');

        const updated = await prisma.question.update({
            where: { id: questionId },
            data: { title, content }
        });

        return {
            id: updated.id,
            title: updated.title,
            content: updated.content,
            createdAt: updated.createdAt.getTime()
        };
    }

    static async removeQuestion(sessionId: string, userId: string, questionId: string): Promise<void> {
        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session) throw new Error('Session not found');
        if (session.interviewerId !== userId) {
            throw new Error('Only interviewer can remove questions');
        }

        await prisma.question.deleteMany({
            where: { id: questionId, sessionId }
        });
    }

    // ============================================
    // Messages
    // ============================================

    static async getMessages(sessionId: string, since?: number): Promise<Message[]> {
        const whereClause: any = { sessionId };
        if (since) {
            whereClause.timestamp = { gt: new Date(since) };
        }

        const messages = await prisma.message.findMany({
            where: whereClause,
            include: { sender: true },
            orderBy: { timestamp: 'asc' as const }
        });

        return messages.map((m: any) => ({
            id: m.id,
            senderId: m.senderId,
            senderRole: m.sender.role as UserRole,
            senderName: m.sender.username,
            content: m.content,
            timestamp: m.timestamp.getTime()
        }));
    }

    static async addMessage(sessionId: string, user: User, content: string): Promise<Message> {
        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session) throw new Error('Session not found');

        const message = await prisma.message.create({
            data: {
                sessionId,
                senderId: user.id,
                content
            },
            include: { sender: true }
        });

        return {
            id: message.id,
            senderId: message.senderId,
            senderRole: message.sender.role as UserRole,
            senderName: message.sender.username,
            content: message.content,
            timestamp: message.timestamp.getTime()
        };
    }

    // ============================================
    // Notes
    // ============================================

    static async getUserNotes(sessionId: string, userId: string): Promise<string> {
        const note = await prisma.note.findUnique({
            where: {
                sessionId_userId: {
                    sessionId,
                    userId
                }
            }
        });
        return note?.content || '';
    }

    static async updateUserNotes(sessionId: string, userId: string, notes: string): Promise<string> {
        const note = await prisma.note.upsert({
            where: {
                sessionId_userId: {
                    sessionId,
                    userId
                }
            },
            update: { content: notes },
            create: {
                sessionId,
                userId,
                content: notes
            }
        });
        return note.content;
    }
}
