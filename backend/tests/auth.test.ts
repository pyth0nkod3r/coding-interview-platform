// tests/auth.test.ts
// Auth service and routes tests

import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/db/prisma.js';
import { AuthService } from '../src/services/auth.service.js';

describe('AuthService', () => {
  beforeEach(async () => {
    // Clean up database (order matters due to FKs)
    await prisma.question.deleteMany();
    await prisma.message.deleteMany();
    await prisma.note.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const user = await AuthService.createUser('testuser', 'test@example.com', 'password123', 'interviewer');

      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('interviewer');
      expect(user.id).toBeDefined();
    });

    it('should throw error for duplicate username', async () => {
      await AuthService.createUser('testuser', 'test@example.com', 'password123', 'interviewer');

      await expect(async () => {
        await AuthService.createUser('testuser', 'test2@example.com', 'password123', 'candidate');
      }).rejects.toThrow('Username or email already taken');
    });
  });

  describe('getUserByUsername', () => {
    it('should return user if exists', async () => {
      await AuthService.createUser('testuser', 'test@example.com', 'password123', 'interviewer');

      const user = await AuthService.getUserByUsername('testuser');
      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
    });

    it('should return null if user does not exist', async () => {
      const user = await AuthService.getUserByUsername('nonexistent');
      expect(user).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const created = await AuthService.createUser('testuser', 'test@example.com', 'password123', 'interviewer');

      const user = await AuthService.getUserById(created.id);
      expect(user).toBeDefined();
      expect(user?.id).toBe(created.id);
    });
  });
});
