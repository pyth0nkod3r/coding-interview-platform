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
    expect(AuthService.getCurrentUser()).toEqual(user);

    AuthService.logout();
    expect(AuthService.getCurrentUser()).toBeNull();

    const loginPromise = AuthService.login('testuser');
    vi.advanceTimersByTime(1000);
    const loggedIn = await loginPromise;
    expect(loggedIn).toEqual(user);
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

    const retrieved = InterviewService.getSession(session.id);
    expect(retrieved).toEqual(session);
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
});
