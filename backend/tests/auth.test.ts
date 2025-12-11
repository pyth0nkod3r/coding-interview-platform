// tests/auth.test.ts
// Auth service and routes tests

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/db/mock.db.js';
import { AuthService } from '../src/services/auth.service.js';

describe('AuthService', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('createUser', () => {
    it('should create a new user successfully', () => {
      const user = AuthService.createUser('testuser', 'test@example.com', 'password123', 'interviewer');

      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('interviewer');
      expect(user.id).toBeDefined();
    });

    it('should throw error for duplicate username', () => {
      AuthService.createUser('testuser', 'test@example.com', 'password123', 'interviewer');

      expect(() => {
        AuthService.createUser('testuser', 'test2@example.com', 'password123', 'candidate');
      }).toThrow('Username already taken');
    });
  });

  describe('getUserByUsername', () => {
    it('should return user if exists', () => {
      AuthService.createUser('testuser', 'test@example.com', 'password123', 'interviewer');

      const user = AuthService.getUserByUsername('testuser');
      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
    });

    it('should return undefined if user does not exist', () => {
      const user = AuthService.getUserByUsername('nonexistent');
      expect(user).toBeUndefined();
    });
  });

  describe('getUserById', () => {
    it('should return user by id', () => {
      const created = AuthService.createUser('testuser', 'test@example.com', 'password123', 'interviewer');

      const user = AuthService.getUserById(created.id);
      expect(user).toBeDefined();
      expect(user?.id).toBe(created.id);
    });
  });
});
