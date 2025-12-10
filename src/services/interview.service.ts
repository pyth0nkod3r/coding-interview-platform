// src/services/interview.service.ts
import { StorageService } from './storage';
import type { User } from './auth.service';

export type Language = 'javascript' | 'python' | 'typescript';

export interface CodeState {
  code: string;
  language: Language;
  output?: string[];
  isRunning?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderRole: 'interviewer' | 'candidate';
  senderName: string;
  content: string;
  timestamp: number;
}

export interface Question {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface InterviewSession {
  id: string;
  interviewerId: string;
  candidateId?: string;
  createdAt: number;
  status: 'active' | 'ended';
  questions: Question[];
  codeState: CodeState;
  permissions: {
    canCandidateRun: boolean;
    canCandidateType: boolean;
  };
  privateNotes: { [userId: string]: string };
  sharedMessages: Message[];
}

export class InterviewService {
  private static SESSIONS_KEY = 'sessions_db';
  private static SESSION_PREFIX = 'session_';

  static async createSession(interviewer: User): Promise<InterviewSession> {
    // Only interviewers can create sessions
    if (interviewer.role !== 'interviewer') {
      throw new Error('Only interviewers can create interview sessions');
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const session: InterviewSession = {
      id: Math.random().toString(36).substr(2, 9),
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
      sharedMessages: []
    };

    // Save to "DB"
    const sessions = StorageService.get<InterviewSession[]>(this.SESSIONS_KEY) || [];
    sessions.push(session);
    StorageService.set(this.SESSIONS_KEY, sessions);

    // Save individual session state for real-time sync
    StorageService.set(`${this.SESSION_PREFIX}${session.id}`, session);

    return session;
  }

  static getSession(sessionId: string): InterviewSession | null {
    return StorageService.get<InterviewSession>(`${this.SESSION_PREFIX}${sessionId}`);
  }

  static getAllSessions(): InterviewSession[] {
    return StorageService.get<InterviewSession[]>(this.SESSIONS_KEY) || [];
  }

  static updateSession(sessionId: string, updates: Partial<InterviewSession>): void {
    const current = this.getSession(sessionId);
    if (!current) return;

    const updated = { ...current, ...updates };
    StorageService.set(`${this.SESSION_PREFIX}${sessionId}`, updated);

    // Also update the main DB list for consistency (optional, but good for history)
    const sessions = this.getAllSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions[index] = updated;
      StorageService.set(this.SESSIONS_KEY, sessions);
    }
  }

  // Update private notes for a specific user
  static updateUserNotes(sessionId: string, userId: string, notes: string): void {
    const current = this.getSession(sessionId);
    if (!current) return;

    const updatedNotes = { ...current.privateNotes, [userId]: notes };
    this.updateSession(sessionId, { privateNotes: updatedNotes });
  }

  // Get private notes for a specific user
  static getUserNotes(sessionId: string, userId: string): string {
    const session = this.getSession(sessionId);
    return session?.privateNotes?.[userId] || '';
  }

  // End interview session
  static endSession(sessionId: string): void {
    this.updateSession(sessionId, { status: 'ended' });
  }

  // Add a question (interviewer only)
  static addQuestion(sessionId: string, title: string, content: string): void {
    const current = this.getSession(sessionId);
    if (!current) return;

    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      content,
      createdAt: Date.now()
    };

    const questions = current.questions || [];
    this.updateSession(sessionId, { questions: [...questions, newQuestion] });
  }

  // Remove a question
  static removeQuestion(sessionId: string, questionId: string): void {
    const current = this.getSession(sessionId);
    if (!current) return;

    const questions = (current.questions || []).filter(q => q.id !== questionId);
    this.updateSession(sessionId, { questions });
  }

  // Update a question
  static updateQuestion(sessionId: string, questionId: string, title: string, content: string): void {
    const current = this.getSession(sessionId);
    if (!current) return;

    const questions = (current.questions || []).map(q =>
      q.id === questionId ? { ...q, title, content } : q
    );
    this.updateSession(sessionId, { questions });
  }

  // Add a message to shared chat
  static addMessage(sessionId: string, message: Omit<Message, 'id' | 'timestamp'>): void {
    const current = this.getSession(sessionId);
    if (!current) return;

    const newMessage: Message = {
      ...message,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };

    const existingMessages = current.sharedMessages || [];
    this.updateSession(sessionId, {
      sharedMessages: [...existingMessages, newMessage]
    });
  }

  // Toggle candidate typing permission
  static toggleCandidateTyping(sessionId: string): boolean {
    const current = this.getSession(sessionId);
    if (!current) return false;

    const newValue = !current.permissions.canCandidateType;
    this.updateSession(sessionId, {
      permissions: { ...current.permissions, canCandidateType: newValue }
    });
    return newValue;
  }

  // Toggle candidate run permission
  static toggleCandidateRun(sessionId: string): boolean {
    const current = this.getSession(sessionId);
    if (!current) return false;

    const newValue = !current.permissions.canCandidateRun;
    this.updateSession(sessionId, {
      permissions: { ...current.permissions, canCandidateRun: newValue }
    });
    return newValue;
  }

  // Subscribe to updates for a specific session
  static subscribeToSession(sessionId: string, callback: (session: InterviewSession | null) => void): () => void {
    return StorageService.subscribe<InterviewSession>(`${this.SESSION_PREFIX}${sessionId}`, callback);
  }
}
