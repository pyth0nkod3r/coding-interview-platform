// src/types/index.ts
// TypeScript interfaces matching OpenAPI spec

export type UserRole = 'interviewer' | 'candidate';
export type SessionStatus = 'active' | 'ended';
export type Language = 'javascript' | 'python' | 'typescript';

export interface User {
    id: string;
    username: string;
    email: string;
    password: string; // Note: In production, this would be hashed
    role: UserRole;
}

export interface Question {
    id: string;
    title: string;
    content: string;
    createdAt: number;
}

export interface Message {
    id: string;
    senderId: string;
    senderRole: UserRole;
    senderName: string;
    content: string;
    timestamp: number;
}

export interface CodeState {
    code: string;
    language: Language;
    output?: string[];
    isRunning?: boolean;
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
    status: SessionStatus;
    questions: Question[];
    codeState: CodeState;
    permissions: Permissions;
    privateNotes: Record<string, string>;
    sharedMessages: Message[];
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface ExecutionResult {
    output: string[];
    error?: string;
}

// Request/Response types
export interface LoginRequest {
    username: string;
    password: string;
}

export interface SignupRequest {
    username: string;
    email: string;
    password: string;
    role: UserRole;
}

export interface AddQuestionRequest {
    title: string;
    content: string;
}

export interface UpdateQuestionRequest {
    title: string;
    content: string;
}

export interface SendMessageRequest {
    content: string;
}

export interface UpdateNotesRequest {
    notes: string;
}

export interface ExecuteCodeRequest {
    code: string;
    language: Language;
}

export interface SessionUpdateRequest {
    codeState?: CodeState;
    permissions?: Permissions;
}
