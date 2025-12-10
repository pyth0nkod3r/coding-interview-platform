// src/services/session.service.ts
// Session management business logic

import { db } from '../db/mock.db.js';
import type {
    InterviewSession,
    User,
    Question,
    Message,
    CodeState,
    Permissions
} from '../types/index.js';

export class SessionService {
    static createSession(interviewer: User): InterviewSession {
        if (interviewer.role !== 'interviewer') {
            throw new Error('Only interviewers can create sessions');
        }

        const session: InterviewSession = {
            id: db.generateId(),
            interviewerId: interviewer.id,
            createdAt: Date.now(),
            status: 'active',
            questions: [],
            codeState: {
                code: '// Start coding here...',
                language: 'javascript',
            },
            permissions: {
                canCandidateRun: true,
                canCandidateType: true,
            },
            privateNotes: {},
            sharedMessages: [],
        };

        return db.createSession(session);
    }

    static getSession(id: string): InterviewSession | undefined {
        return db.getSession(id);
    }

    static getSessionsByUser(userId: string): InterviewSession[] {
        return db.getSessionsByUser(userId);
    }

    static getAllSessions(): InterviewSession[] {
        return db.getAllSessions();
    }

    static updateSession(
        id: string,
        updates: { codeState?: CodeState; permissions?: Permissions }
    ): InterviewSession | undefined {
        return db.updateSession(id, updates);
    }

    static joinSession(sessionId: string, candidateId: string): InterviewSession {
        const session = db.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        if (session.status === 'ended') {
            throw new Error('Session has ended');
        }
        if (session.candidateId && session.candidateId !== candidateId) {
            throw new Error('Session already has a candidate');
        }

        const updated = db.updateSession(sessionId, { candidateId });
        if (!updated) throw new Error('Failed to join session');
        return updated;
    }

    static endSession(sessionId: string, userId: string): InterviewSession {
        const session = db.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        if (session.interviewerId !== userId) {
            throw new Error('Only interviewer can end session');
        }

        const updated = db.updateSession(sessionId, { status: 'ended' });
        if (!updated) throw new Error('Failed to end session');
        return updated;
    }

    // ============================================
    // Permissions
    // ============================================

    static toggleCandidateTyping(sessionId: string, userId: string): boolean {
        const session = db.getSession(sessionId);
        if (!session) throw new Error('Session not found');
        if (session.interviewerId !== userId) {
            throw new Error('Only interviewer can change permissions');
        }

        const newValue = !session.permissions.canCandidateType;
        db.updateSession(sessionId, {
            permissions: { ...session.permissions, canCandidateType: newValue },
        });
        return newValue;
    }

    static toggleCandidateRun(sessionId: string, userId: string): boolean {
        const session = db.getSession(sessionId);
        if (!session) throw new Error('Session not found');
        if (session.interviewerId !== userId) {
            throw new Error('Only interviewer can change permissions');
        }

        const newValue = !session.permissions.canCandidateRun;
        db.updateSession(sessionId, {
            permissions: { ...session.permissions, canCandidateRun: newValue },
        });
        return newValue;
    }

    // ============================================
    // Questions
    // ============================================

    static addQuestion(sessionId: string, userId: string, title: string, content: string): Question {
        const session = db.getSession(sessionId);
        if (!session) throw new Error('Session not found');
        if (session.interviewerId !== userId) {
            throw new Error('Only interviewer can add questions');
        }

        const question: Question = {
            id: db.generateId(),
            title,
            content,
            createdAt: Date.now(),
        };

        db.updateSession(sessionId, {
            questions: [...session.questions, question],
        });

        return question;
    }

    static updateQuestion(
        sessionId: string,
        userId: string,
        questionId: string,
        title: string,
        content: string
    ): Question {
        const session = db.getSession(sessionId);
        if (!session) throw new Error('Session not found');
        if (session.interviewerId !== userId) {
            throw new Error('Only interviewer can update questions');
        }

        const questionIndex = session.questions.findIndex(q => q.id === questionId);
        if (questionIndex === -1) throw new Error('Question not found');

        const updatedQuestion = { ...session.questions[questionIndex], title, content };
        const questions = [...session.questions];
        questions[questionIndex] = updatedQuestion;

        db.updateSession(sessionId, { questions });
        return updatedQuestion;
    }

    static removeQuestion(sessionId: string, userId: string, questionId: string): void {
        const session = db.getSession(sessionId);
        if (!session) throw new Error('Session not found');
        if (session.interviewerId !== userId) {
            throw new Error('Only interviewer can remove questions');
        }

        const questions = session.questions.filter(q => q.id !== questionId);
        db.updateSession(sessionId, { questions });
    }

    // ============================================
    // Messages
    // ============================================

    static getMessages(sessionId: string, since?: number): Message[] {
        const session = db.getSession(sessionId);
        if (!session) throw new Error('Session not found');

        if (since) {
            return session.sharedMessages.filter(m => m.timestamp > since);
        }
        return session.sharedMessages;
    }

    static addMessage(sessionId: string, user: User, content: string): Message {
        const session = db.getSession(sessionId);
        if (!session) throw new Error('Session not found');

        const isInterviewer = session.interviewerId === user.id;
        const message: Message = {
            id: db.generateId(),
            senderId: user.id,
            senderRole: isInterviewer ? 'interviewer' : 'candidate',
            senderName: user.username,
            content,
            timestamp: Date.now(),
        };

        db.updateSession(sessionId, {
            sharedMessages: [...session.sharedMessages, message],
        });

        return message;
    }

    // ============================================
    // Notes
    // ============================================

    static getUserNotes(sessionId: string, userId: string): string {
        const session = db.getSession(sessionId);
        if (!session) throw new Error('Session not found');
        return session.privateNotes[userId] || '';
    }

    static updateUserNotes(sessionId: string, userId: string, notes: string): string {
        const session = db.getSession(sessionId);
        if (!session) throw new Error('Session not found');

        db.updateSession(sessionId, {
            privateNotes: { ...session.privateNotes, [userId]: notes },
        });

        return notes;
    }
}
