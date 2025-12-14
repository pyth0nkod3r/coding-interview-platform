// src/services/interview.service.ts
// Interview session service using backend API

import { api } from '../utils/api';
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

export interface Permissions {
  canCandidateRun: boolean;
  canCandidateType: boolean;
  canRequestVideo: boolean;
}

export interface InterviewSession {
  id: string;
  interviewerId: string;
  candidateId?: string;
  createdAt: number;
  status: 'active' | 'ended';
  questions: Question[];
  codeState: CodeState;
  permissions: Permissions;
  privateNotes: { [userId: string]: string };
  sharedMessages: Message[];
}

export interface ExecutionResult {
  output: string[];
  error?: string | null;
}

export class InterviewService {
  // Polling interval for real-time updates (in ms)
  private static POLL_INTERVAL = 1000;

  // ============================================
  // Session CRUD
  // ============================================

  static async createSession(interviewer: User): Promise<InterviewSession> {
    if (interviewer.role !== 'interviewer') {
      throw new Error('Only interviewers can create interview sessions');
    }
    return api.post<InterviewSession>('/sessions');
  }

  static async getSession(sessionId: string): Promise<InterviewSession | null> {
    try {
      return await api.get<InterviewSession>(`/sessions/${sessionId}`);
    } catch {
      return null;
    }
  }

  static async getAllSessions(): Promise<InterviewSession[]> {
    return api.get<InterviewSession[]>('/sessions');
  }

  static async updateSession(
    sessionId: string,
    updates: { codeState?: CodeState; permissions?: Permissions }
  ): Promise<InterviewSession | null> {
    try {
      return await api.patch<InterviewSession>(`/sessions/${sessionId}`, updates);
    } catch {
      return null;
    }
  }

  static async joinSession(sessionId: string): Promise<InterviewSession> {
    return api.post<InterviewSession>(`/sessions/${sessionId}/join`);
  }

  static async endSession(sessionId: string): Promise<InterviewSession> {
    return api.post<InterviewSession>(`/sessions/${sessionId}/end`);
  }

  // ============================================
  // Permissions
  // ============================================

  static async toggleCandidateTyping(sessionId: string): Promise<boolean> {
    const result = await api.post<{ canCandidateType: boolean }>(
      `/sessions/${sessionId}/permissions/typing`
    );
    return result.canCandidateType;
  }

  static async toggleCandidateRun(sessionId: string): Promise<boolean> {
    const result = await api.post<{ canCandidateRun: boolean }>(
      `/sessions/${sessionId}/permissions/run`
    );
    return result.canCandidateRun;
  }

  // ============================================
  // Questions
  // ============================================

  static async getQuestions(sessionId: string): Promise<Question[]> {
    return api.get<Question[]>(`/sessions/${sessionId}/questions`);
  }

  static async addQuestion(sessionId: string, title: string, content: string): Promise<Question> {
    return api.post<Question>(`/sessions/${sessionId}/questions`, { title, content });
  }

  static async updateQuestion(
    sessionId: string,
    questionId: string,
    title: string,
    content: string
  ): Promise<Question> {
    return api.put<Question>(`/sessions/${sessionId}/questions/${questionId}`, { title, content });
  }

  static async removeQuestion(sessionId: string, questionId: string): Promise<void> {
    await api.delete(`/sessions/${sessionId}/questions/${questionId}`);
  }

  // ============================================
  // Messages
  // ============================================

  static async getMessages(sessionId: string, since?: number): Promise<Message[]> {
    const endpoint = since
      ? `/sessions/${sessionId}/messages?since=${since}`
      : `/sessions/${sessionId}/messages`;
    return api.get<Message[]>(endpoint);
  }

  static async addMessage(sessionId: string, content: string): Promise<Message> {
    return api.post<Message>(`/sessions/${sessionId}/messages`, { content });
  }

  // ============================================
  // Notes
  // ============================================

  static async getUserNotes(sessionId: string): Promise<string> {
    const result = await api.get<{ notes: string }>(`/sessions/${sessionId}/notes`);
    return result.notes;
  }

  static async updateUserNotes(sessionId: string, notes: string): Promise<string> {
    const result = await api.put<{ notes: string }>(`/sessions/${sessionId}/notes`, { notes });
    return result.notes;
  }

  // ============================================
  // Code Execution
  // ============================================

  static async executeCode(code: string, language: Language): Promise<ExecutionResult> {
    return api.post<ExecutionResult>('/code/execute', { code, language });
  }

  // ============================================
  // Real-time Updates (Polling)
  // ============================================

  static subscribeToSession(
    sessionId: string,
    callback: (session: InterviewSession | null) => void
  ): () => void {
    let isActive = true;

    const poll = async () => {
      if (!isActive) return;

      try {
        const session = await this.getSession(sessionId);
        if (isActive) {
          callback(session);
        }
      } catch {
        if (isActive) {
          callback(null);
        }
      }

      if (isActive) {
        setTimeout(poll, this.POLL_INTERVAL);
      }
    };

    // Start polling
    poll();

    // Return unsubscribe function
    return () => {
      isActive = false;
    };
  }
}
