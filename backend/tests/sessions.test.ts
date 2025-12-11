// tests/sessions.test.ts
// Session service tests

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/db/mock.db.js';
import { AuthService } from '../src/services/auth.service.js';
import { SessionService } from '../src/services/session.service.js';
import type { User } from '../src/types/index.js';

describe('SessionService', () => {
    let interviewer: User;
    let candidate: User;

    beforeEach(() => {
        db.clear();
        interviewer = AuthService.createUser('interviewer1', 'interviewer@test.com', 'password123', 'interviewer');
        candidate = AuthService.createUser('candidate1', 'candidate@test.com', 'password123', 'candidate');
    });

    describe('createSession', () => {
        it('should create session for interviewer', () => {
            const session = SessionService.createSession(interviewer);

            expect(session).toBeDefined();
            expect(session.interviewerId).toBe(interviewer.id);
            expect(session.status).toBe('active');
            expect(session.questions).toEqual([]);
            expect(session.permissions.canCandidateType).toBe(true);
        });

        it('should throw error for candidate trying to create session', () => {
            expect(() => {
                SessionService.createSession(candidate);
            }).toThrow('Only interviewers can create sessions');
        });
    });

    describe('joinSession', () => {
        it('should allow candidate to join session', () => {
            const session = SessionService.createSession(interviewer);
            const joined = SessionService.joinSession(session.id, candidate.id);

            expect(joined.candidateId).toBe(candidate.id);
        });

        it('should throw error for non-existent session', () => {
            expect(() => {
                SessionService.joinSession('nonexistent', candidate.id);
            }).toThrow('Session not found');
        });
    });

    describe('endSession', () => {
        it('should end session for interviewer', () => {
            const session = SessionService.createSession(interviewer);
            const ended = SessionService.endSession(session.id, interviewer.id);

            expect(ended.status).toBe('ended');
        });

        it('should throw error for non-interviewer', () => {
            const session = SessionService.createSession(interviewer);

            expect(() => {
                SessionService.endSession(session.id, candidate.id);
            }).toThrow('Only interviewer can end session');
        });
    });

    describe('questions', () => {
        it('should add question', () => {
            const session = SessionService.createSession(interviewer);
            const question = SessionService.addQuestion(session.id, interviewer.id, 'Two Sum', 'Find two numbers...');

            expect(question.title).toBe('Two Sum');
            expect(question.content).toBe('Find two numbers...');
        });

        it('should remove question', () => {
            const session = SessionService.createSession(interviewer);
            const question = SessionService.addQuestion(session.id, interviewer.id, 'Two Sum', 'Find two numbers...');

            SessionService.removeQuestion(session.id, interviewer.id, question.id);

            const updated = SessionService.getSession(session.id);
            expect(updated?.questions.length).toBe(0);
        });

        it('should update question', () => {
            const session = SessionService.createSession(interviewer);
            const question = SessionService.addQuestion(session.id, interviewer.id, 'Two Sum', 'Find two numbers...');

            const updated = SessionService.updateQuestion(session.id, interviewer.id, question.id, 'Updated Title', 'Updated content');

            expect(updated.title).toBe('Updated Title');
            expect(updated.content).toBe('Updated content');
        });
    });

    describe('messages', () => {
        it('should add and get messages', () => {
            const session = SessionService.createSession(interviewer);
            const message = SessionService.addMessage(session.id, interviewer, 'Hello candidate!');

            expect(message.content).toBe('Hello candidate!');
            expect(message.senderRole).toBe('interviewer');

            const messages = SessionService.getMessages(session.id);
            expect(messages.length).toBe(1);
        });

        it('should filter messages by since timestamp', () => {
            const session = SessionService.createSession(interviewer);
            SessionService.addMessage(session.id, interviewer, 'First message');

            const now = Date.now();

            // Add a small delay simulation
            const msg2 = SessionService.addMessage(session.id, candidate, 'Second message');

            const messagesSince = SessionService.getMessages(session.id, now - 1);
            expect(messagesSince.length).toBe(2);
        });
    });

    describe('notes', () => {
        it('should update and get user notes', () => {
            const session = SessionService.createSession(interviewer);

            SessionService.updateUserNotes(session.id, interviewer.id, 'These are my private notes');
            const notes = SessionService.getUserNotes(session.id, interviewer.id);

            expect(notes).toBe('These are my private notes');
        });

        it('should return empty string for no notes', () => {
            const session = SessionService.createSession(interviewer);
            const notes = SessionService.getUserNotes(session.id, interviewer.id);

            expect(notes).toBe('');
        });
    });

    describe('permissions', () => {
        it('should toggle typing permission', () => {
            const session = SessionService.createSession(interviewer);
            expect(session.permissions.canCandidateType).toBe(true);

            const newValue = SessionService.toggleCandidateTyping(session.id, interviewer.id);
            expect(newValue).toBe(false);

            const newValue2 = SessionService.toggleCandidateTyping(session.id, interviewer.id);
            expect(newValue2).toBe(true);
        });

        it('should toggle run permission', () => {
            const session = SessionService.createSession(interviewer);
            expect(session.permissions.canCandidateRun).toBe(true);

            const newValue = SessionService.toggleCandidateRun(session.id, interviewer.id);
            expect(newValue).toBe(false);
        });
    });
});
