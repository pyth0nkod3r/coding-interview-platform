import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageService } from './storage';
import { AuthService } from './auth.service';
import { InterviewService } from './interview.service';

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and retrieve data', () => {
    StorageService.set('test', { foo: 'bar' });
    const result = StorageService.get('test');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('should remove data', () => {
    StorageService.set('test', 'data');
    StorageService.remove('test');
    expect(StorageService.get('test')).toBeNull();
  });

  it('should return null for non-existent key', () => {
    expect(StorageService.get('nonexistent')).toBeNull();
  });

  it('should subscribe and receive same-tab updates via CustomEvent', () => {
    const callback = vi.fn();
    const unsubscribe = StorageService.subscribe('test', callback);

    StorageService.set('test', { data: 'value' });

    expect(callback).toHaveBeenCalledWith({ data: 'value' });
    unsubscribe();
  });

  it('should unsubscribe correctly', () => {
    const callback = vi.fn();
    const unsubscribe = StorageService.subscribe('test', callback);
    unsubscribe();

    StorageService.set('test', 'newvalue');

    // Callback should not have been called after unsubscribe
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should signup and login user', async () => {
    const signupPromise = AuthService.signup('testuser', 'test@example.com', 'candidate');

    // Fast-forward time
    vi.advanceTimersByTime(1000);

    const user = await signupPromise;
    expect(user.username).toBe('testuser');
    expect(user.role).toBe('candidate');
    expect(AuthService.getCurrentUser()).toEqual(user);

    AuthService.logout();
    expect(AuthService.getCurrentUser()).toBeNull();

    const loginPromise = AuthService.login('testuser');
    vi.advanceTimersByTime(1000);
    const loggedIn = await loginPromise;
    expect(loggedIn).toEqual(user);
  });

  it('should throw error when login with non-existent user', async () => {
    const loginPromise = AuthService.login('nonexistent');
    vi.advanceTimersByTime(1000);

    await expect(loginPromise).rejects.toThrow('User not found');
  });

  it('should throw error when signup with duplicate username', async () => {
    const signupPromise1 = AuthService.signup('duplicate', 'test1@example.com', 'candidate');
    vi.advanceTimersByTime(1000);
    await signupPromise1;

    const signupPromise2 = AuthService.signup('duplicate', 'test2@example.com', 'interviewer');
    vi.advanceTimersByTime(1000);

    await expect(signupPromise2).rejects.toThrow('Username already taken');
  });

  it('should correctly report isAuthenticated', async () => {
    expect(AuthService.isAuthenticated()).toBe(false);

    const signupPromise = AuthService.signup('authtest', 'auth@example.com', 'candidate');
    vi.advanceTimersByTime(1000);
    await signupPromise;

    expect(AuthService.isAuthenticated()).toBe(true);

    AuthService.logout();
    expect(AuthService.isAuthenticated()).toBe(false);
  });
});

describe('InterviewService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create a session', async () => {
    const user = { id: '1', username: 'interviewer', email: 'i@test.com', role: 'interviewer' as const };
    const promise = InterviewService.createSession(user);

    vi.advanceTimersByTime(1000);
    const session = await promise;

    expect(session.interviewerId).toBe('1');
    expect(session.codeState.language).toBe('javascript');
    expect(session.status).toBe('active');
    expect(session.questions).toEqual([]);
    expect(session.sharedMessages).toEqual([]);

    const retrieved = InterviewService.getSession(session.id);
    expect(retrieved).toEqual(session);
  });

  it('should reject session creation by candidate', async () => {
    const candidate = { id: '2', username: 'candidate', email: 'c@test.com', role: 'candidate' as const };
    const promise = InterviewService.createSession(candidate);

    vi.advanceTimersByTime(1000);

    await expect(promise).rejects.toThrow('Only interviewers can create interview sessions');
  });

  it('should update session state', async () => {
    const user = { id: '1', username: 'interviewer', email: 'i@test.com', role: 'interviewer' as const };
    const promise = InterviewService.createSession(user);

    vi.advanceTimersByTime(1000);
    const session = await promise;

    InterviewService.updateSession(session.id, {
      codeState: { ...session.codeState, code: 'console.log("hello")' }
    });

    const updated = InterviewService.getSession(session.id);
    expect(updated?.codeState.code).toBe('console.log("hello")');
  });

  it('should get all sessions', async () => {
    const user = { id: '1', username: 'interviewer', email: 'i@test.com', role: 'interviewer' as const };

    const promise1 = InterviewService.createSession(user);
    vi.advanceTimersByTime(1000);
    await promise1;

    const promise2 = InterviewService.createSession(user);
    vi.advanceTimersByTime(1000);
    await promise2;

    const allSessions = InterviewService.getAllSessions();
    expect(allSessions.length).toBe(2);
  });

  it('should update and get user notes', async () => {
    const user = { id: '1', username: 'interviewer', email: 'i@test.com', role: 'interviewer' as const };
    const promise = InterviewService.createSession(user);
    vi.advanceTimersByTime(1000);
    const session = await promise;

    InterviewService.updateUserNotes(session.id, user.id, 'Private note content');

    const notes = InterviewService.getUserNotes(session.id, user.id);
    expect(notes).toBe('Private note content');
  });

  it('should return empty string for non-existent notes', async () => {
    const user = { id: '1', username: 'interviewer', email: 'i@test.com', role: 'interviewer' as const };
    const promise = InterviewService.createSession(user);
    vi.advanceTimersByTime(1000);
    const session = await promise;

    const notes = InterviewService.getUserNotes(session.id, 'unknown-user');
    expect(notes).toBe('');
  });

  it('should end session', async () => {
    const user = { id: '1', username: 'interviewer', email: 'i@test.com', role: 'interviewer' as const };
    const promise = InterviewService.createSession(user);
    vi.advanceTimersByTime(1000);
    const session = await promise;

    InterviewService.endSession(session.id);

    const updated = InterviewService.getSession(session.id);
    expect(updated?.status).toBe('ended');
  });

  it('should add a question', async () => {
    const user = { id: '1', username: 'interviewer', email: 'i@test.com', role: 'interviewer' as const };
    const promise = InterviewService.createSession(user);
    vi.advanceTimersByTime(1000);
    const session = await promise;

    InterviewService.addQuestion(session.id, 'Two Sum', 'Find two numbers that add up to target');

    const updated = InterviewService.getSession(session.id);
    expect(updated?.questions.length).toBe(1);
    expect(updated?.questions[0].title).toBe('Two Sum');
    expect(updated?.questions[0].content).toBe('Find two numbers that add up to target');
  });

  it('should remove a question', async () => {
    const user = { id: '1', username: 'interviewer', email: 'i@test.com', role: 'interviewer' as const };
    const promise = InterviewService.createSession(user);
    vi.advanceTimersByTime(1000);
    const session = await promise;

    InterviewService.addQuestion(session.id, 'Question 1', 'Content 1');
    InterviewService.addQuestion(session.id, 'Question 2', 'Content 2');

    let updated = InterviewService.getSession(session.id);
    expect(updated?.questions.length).toBe(2);

    const questionIdToRemove = updated?.questions[0].id;
    InterviewService.removeQuestion(session.id, questionIdToRemove!);

    updated = InterviewService.getSession(session.id);
    expect(updated?.questions.length).toBe(1);
    expect(updated?.questions[0].title).toBe('Question 2');
  });

  it('should update a question', async () => {
    const user = { id: '1', username: 'interviewer', email: 'i@test.com', role: 'interviewer' as const };
    const promise = InterviewService.createSession(user);
    vi.advanceTimersByTime(1000);
    const session = await promise;

    InterviewService.addQuestion(session.id, 'Original Title', 'Original Content');

    let updated = InterviewService.getSession(session.id);
    const questionId = updated?.questions[0].id;

    InterviewService.updateQuestion(session.id, questionId!, 'Updated Title', 'Updated Content');

    updated = InterviewService.getSession(session.id);
    expect(updated?.questions[0].title).toBe('Updated Title');
    expect(updated?.questions[0].content).toBe('Updated Content');
  });

  it('should add a message', async () => {
    const user = { id: '1', username: 'interviewer', email: 'i@test.com', role: 'interviewer' as const };
    const promise = InterviewService.createSession(user);
    vi.advanceTimersByTime(1000);
    const session = await promise;

    InterviewService.addMessage(session.id, {
      senderId: user.id,
      senderRole: 'interviewer',
      senderName: user.username,
      content: 'Hello candidate!'
    });

    const updated = InterviewService.getSession(session.id);
    expect(updated?.sharedMessages.length).toBe(1);
    expect(updated?.sharedMessages[0].content).toBe('Hello candidate!');
    expect(updated?.sharedMessages[0].id).toBeDefined();
    expect(updated?.sharedMessages[0].timestamp).toBeDefined();
  });

  it('should toggle candidate typing permission', async () => {
    const user = { id: '1', username: 'interviewer', email: 'i@test.com', role: 'interviewer' as const };
    const promise = InterviewService.createSession(user);
    vi.advanceTimersByTime(1000);
    const session = await promise;

    expect(session.permissions.canCandidateType).toBe(true);

    const newValue = InterviewService.toggleCandidateTyping(session.id);
    expect(newValue).toBe(false);

    const updated = InterviewService.getSession(session.id);
    expect(updated?.permissions.canCandidateType).toBe(false);

    const restored = InterviewService.toggleCandidateTyping(session.id);
    expect(restored).toBe(true);
  });

  it('should toggle candidate run permission', async () => {
    const user = { id: '1', username: 'interviewer', email: 'i@test.com', role: 'interviewer' as const };
    const promise = InterviewService.createSession(user);
    vi.advanceTimersByTime(1000);
    const session = await promise;

    expect(session.permissions.canCandidateRun).toBe(true);

    const newValue = InterviewService.toggleCandidateRun(session.id);
    expect(newValue).toBe(false);

    const updated = InterviewService.getSession(session.id);
    expect(updated?.permissions.canCandidateRun).toBe(false);
  });

  it('should return false when toggling permissions for non-existent session', () => {
    const result = InterviewService.toggleCandidateTyping('nonexistent');
    expect(result).toBe(false);

    const result2 = InterviewService.toggleCandidateRun('nonexistent');
    expect(result2).toBe(false);
  });

  it('should handle update on non-existent session gracefully', () => {
    // Should not throw
    InterviewService.updateSession('nonexistent', { status: 'ended' });
    InterviewService.updateUserNotes('nonexistent', 'user1', 'notes');
    InterviewService.addQuestion('nonexistent', 'title', 'content');
    InterviewService.removeQuestion('nonexistent', 'q1');
    InterviewService.updateQuestion('nonexistent', 'q1', 'title', 'content');
    InterviewService.addMessage('nonexistent', {
      senderId: '1',
      senderRole: 'interviewer',
      senderName: 'test',
      content: 'hello'
    });
  });
});
