import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from './storage';

// Note: AuthService and InterviewService now use the backend API.
// Their tests are handled by the backend test suite at backend/tests/*.test.ts
// This file only tests StorageService which is still used for token/user caching.

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
