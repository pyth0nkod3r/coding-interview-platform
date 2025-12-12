// tests/sessions.test.ts
// Session service tests

import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/db/prisma.js';
import { AuthService } from '../src/services/auth.service.js';
import { SessionService } from '../src/services/session.service.js';
import type { User } from '../src/types/index.js';

describe('SessionService', () => {
    let interviewer: User;
    let candidate: User;

    beforeEach(async () => {
        // Clean up database
        await prisma.question.deleteMany();
        await prisma.message.deleteMany();
        await prisma.note.deleteMany();
        await prisma.session.deleteMany();
        await prisma.user.deleteMany();

        interviewer = await AuthService.createUser('interviewer1', 'interviewer@test.com', 'password123', 'interviewer');
        candidate = await AuthService.createUser('candidate1', 'candidate@test.com', 'password123', 'candidate');
    });

    describe('createSession', () => {
        it('should create session for interviewer', async () => {
            const session = await SessionService.createSession(interviewer);

            expect(session).toBeDefined();
            expect(session.interviewerId).toBe(interviewer.id);
            expect(session.status).toBe('active');
            expect(session.questions).toEqual([]);
            expect(session.permissions.canCandidateType).toBe(true);
        });

        it('should throw error for candidate trying to create session', async () => {
            await expect(async () => {
                await SessionService.createSession(candidate);
            }).rejects.toThrow('Only interviewers can create sessions');
        });
    });

    describe('joinSession', () => {
        it('should allow candidate to join session', async () => {
            const session = await SessionService.createSession(interviewer);
            const joined = await SessionService.joinSession(session.id, candidate.id);

            expect(joined.candidateId).toBe(candidate.id);
        });

        it('should throw error for non-existent session', async () => {
            await expect(async () => {
                await SessionService.joinSession('nonexistent-uuid', candidate.id);
            }).rejects.toThrow('Session not found');
        });
    });

    describe('endSession', () => {
        it('should end session for interviewer', async () => {
            const session = await SessionService.createSession(interviewer);
            const ended = await SessionService.endSession(session.id, interviewer.id);

            expect(ended.status).toBe('ended');
        });

        it('should throw error for non-interviewer', async () => {
            const session = await SessionService.createSession(interviewer);

            await expect(async () => {
                await SessionService.endSession(session.id, candidate.id);
            }).rejects.toThrow('Only interviewer can end session');
        });
    });

    describe('questions', () => {
        it('should add question', async () => {
            const session = await SessionService.createSession(interviewer);
            const question = await SessionService.addQuestion(session.id, interviewer.id, 'Two Sum', 'Find two numbers...');

            expect(question.title).toBe('Two Sum');
            expect(question.content).toBe('Find two numbers...');
        });

        it('should remove question', async () => {
            const session = await SessionService.createSession(interviewer);
            const question = await SessionService.addQuestion(session.id, interviewer.id, 'Two Sum', 'Find two numbers...');

            await SessionService.removeQuestion(session.id, interviewer.id, question.id);

            const updated = await SessionService.getSession(session.id);
            expect(updated?.questions.length).toBe(0);
        });

        it('should update question', async () => {
            const session = await SessionService.createSession(interviewer);
            const question = await SessionService.addQuestion(session.id, interviewer.id, 'Two Sum', 'Find two numbers...');

            const updated = await SessionService.updateQuestion(session.id, interviewer.id, question.id, 'Updated Title', 'Updated content');

            expect(updated.title).toBe('Updated Title');
            expect(updated.content).toBe('Updated content');
        });
    });

    describe('messages', () => {
        it('should add and get messages', async () => {
            const session = await SessionService.createSession(interviewer);
            const message = await SessionService.addMessage(session.id, interviewer, 'Hello candidate!');

            expect(message.content).toBe('Hello candidate!');
            expect(message.senderRole).toBe('interviewer');

            const messages = await SessionService.getMessages(session.id);
            expect(messages.length).toBe(1);
        });

        it('should filter messages by since timestamp', async () => {
            const session = await SessionService.createSession(interviewer);
            await SessionService.addMessage(session.id, interviewer, 'First message');

            const now = Date.now();
            await new Promise(r => setTimeout(r, 10)); // Ensure timestamp diff

            // Add a small delay simulation
            await SessionService.addMessage(session.id, candidate, 'Second message');

            const messagesSince = await SessionService.getMessages(session.id, now - 1);
            expect(messagesSince.length).toBe(1); // Should only get second message
        });
    });

    describe('notes', () => {
        it('should update and get user notes', async () => {
            const session = await SessionService.createSession(interviewer);

            await SessionService.updateUserNotes(session.id, interviewer.id, 'These are my private notes');
            const notes = await SessionService.getUserNotes(session.id, interviewer.id);

            expect(notes).toBe('These are my private notes');
        });

        it('should return empty string for no notes', async () => {
            const session = await SessionService.createSession(interviewer);
            const notes = await SessionService.getUserNotes(session.id, interviewer.id);

            expect(notes).toBe('');
        });
    });

    describe('permissions', () => {
        it('should toggle typing permission', async () => {
            const session = await SessionService.createSession(interviewer);
            expect(session.permissions.canCandidateType).toBe(true);

            const newValue = await SessionService.toggleCandidateTyping(session.id, interviewer.id);
            expect(newValue).toBe(false);

            const newValue2 = await SessionService.toggleCandidateTyping(session.id, interviewer.id);
            expect(newValue2).toBe(true);
        });

        it('should toggle run permission', async () => {
            const session = await SessionService.createSession(interviewer);
            expect(session.permissions.canCandidateRun).toBe(true);

            const newValue = await SessionService.toggleCandidateRun(session.id, interviewer.id);
            expect(newValue).toBe(false);
        });
    });
});
