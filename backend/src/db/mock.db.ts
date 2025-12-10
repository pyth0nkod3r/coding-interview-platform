// src/db/mock.db.ts
// In-memory mock database - easily replaceable with real DB later

import type { User, InterviewSession } from '../types/index.js';

class MockDatabase {
    private users: Map<string, User> = new Map();
    private usersByUsername: Map<string, User> = new Map();
    private sessions: Map<string, InterviewSession> = new Map();

    // ============================================
    // User operations
    // ============================================

    createUser(user: User): User {
        this.users.set(user.id, user);
        this.usersByUsername.set(user.username, user);
        return user;
    }

    getUserById(id: string): User | undefined {
        return this.users.get(id);
    }

    getUserByUsername(username: string): User | undefined {
        return this.usersByUsername.get(username);
    }

    // ============================================
    // Session operations
    // ============================================

    createSession(session: InterviewSession): InterviewSession {
        this.sessions.set(session.id, session);
        return session;
    }

    getSession(id: string): InterviewSession | undefined {
        return this.sessions.get(id);
    }

    getAllSessions(): InterviewSession[] {
        return Array.from(this.sessions.values());
    }

    getSessionsByUser(userId: string): InterviewSession[] {
        return Array.from(this.sessions.values()).filter(
            s => s.interviewerId === userId || s.candidateId === userId
        );
    }

    updateSession(id: string, updates: Partial<InterviewSession>): InterviewSession | undefined {
        const session = this.sessions.get(id);
        if (!session) return undefined;

        const updated = { ...session, ...updates };
        this.sessions.set(id, updated);
        return updated;
    }

    deleteSession(id: string): boolean {
        return this.sessions.delete(id);
    }

    // ============================================
    // Utility
    // ============================================

    generateId(): string {
        return Math.random().toString(36).substring(2, 11);
    }

    clear(): void {
        this.users.clear();
        this.usersByUsername.clear();
        this.sessions.clear();
    }
}

// Singleton instance
export const db = new MockDatabase();
