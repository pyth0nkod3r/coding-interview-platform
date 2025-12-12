// src/services/auth.service.ts
// Authentication business logic

import { prisma } from '../db/prisma.js';
import type { User, UserRole } from '../types/index.js';

export class AuthService {
    static async createUser(username: string, email: string, password: string, role: UserRole): Promise<User> {
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            throw new Error('Username or email already taken');
        }

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password, // Note: In production, hash this with bcrypt
                role,
            }
        });

        return user as User;
    }

    static validatePassword(user: User, password: string): boolean {
        // In production, use bcrypt.compare()
        return user.password === password;
    }

    static async getUserByUsername(username: string): Promise<User | null> {
        const user = await prisma.user.findUnique({
            where: { username }
        });
        return user as User | null;
    }

    static async getUserById(id: string): Promise<User | null> {
        const user = await prisma.user.findUnique({
            where: { id }
        });
        return user as User | null;
    }
}
