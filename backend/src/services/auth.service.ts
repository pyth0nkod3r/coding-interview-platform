// src/services/auth.service.ts
// Authentication business logic

import { db } from '../db/mock.db.js';
import type { User, UserRole } from '../types/index.js';

export class AuthService {
    static createUser(username: string, email: string, password: string, role: UserRole): User {
        const existingUser = db.getUserByUsername(username);
        if (existingUser) {
            throw new Error('Username already taken');
        }

        const user: User = {
            id: db.generateId(),
            username,
            email,
            password, // Note: In production, hash this with bcrypt
            role,
        };

        return db.createUser(user);
    }

    static validatePassword(user: User, password: string): boolean {
        // In production, use bcrypt.compare()
        return user.password === password;
    }

    static getUserByUsername(username: string): User | undefined {
        return db.getUserByUsername(username);
    }

    static getUserById(id: string): User | undefined {
        return db.getUserById(id);
    }
}
