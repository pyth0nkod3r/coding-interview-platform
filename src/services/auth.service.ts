// src/services/auth.service.ts
import { StorageService } from './storage';

export type UserRole = 'interviewer' | 'candidate';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export class AuthService {
  private static USER_KEY = 'current_user';
  private static USERS_DB_KEY = 'users_db'; // Mock database of all users

  static async login(username: string): Promise<User> {
    // Mock login delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = StorageService.get<User[]>(this.USERS_DB_KEY) || [];
    let user = users.find(u => u.username === username);

    if (!user) {
      // Auto-signup for simplicity if user doesn't exist? 
      // Or require explicit signup. Let's do explicit signup in UI, 
      // but for now, this mock login just simulates a successful login if user exists.
      throw new Error('User not found. Please sign up.');
    }

    StorageService.set(this.USER_KEY, user);
    return user;
  }

  static async signup(username: string, email: string, role: UserRole): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = StorageService.get<User[]>(this.USERS_DB_KEY) || [];
    
    if (users.find(u => u.username === username)) {
      throw new Error('Username already taken');
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      email,
      role
    };

    users.push(newUser);
    StorageService.set(this.USERS_DB_KEY, users);
    StorageService.set(this.USER_KEY, newUser);

    return newUser;
  }

  static logout(): void {
    StorageService.remove(this.USER_KEY);
  }

  static getCurrentUser(): User | null {
    return StorageService.get<User>(this.USER_KEY);
  }

  static isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }
}
