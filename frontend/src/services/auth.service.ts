// src/services/auth.service.ts
// Authentication service using backend API

import { api } from '../utils/api';

export type UserRole = 'interviewer' | 'candidate';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

interface AuthResponse {
  user: User;
  token: string;
}

const USER_KEY = 'current_user';

export class AuthService {
  static async login(username: string): Promise<User> {
    const response = await api.post<AuthResponse>('/auth/login', { username });

    // Store token and user
    api.setToken(response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));

    return response.user;
  }

  static async signup(username: string, email: string, role: UserRole): Promise<User> {
    const response = await api.post<AuthResponse>('/auth/signup', {
      username,
      email,
      role
    });

    // Store token and user
    api.setToken(response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));

    return response.user;
  }

  static async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      // Always clear local state, even if API fails
      api.clearToken();
      localStorage.removeItem(USER_KEY);
    }
  }

  static getCurrentUser(): User | null {
    const userData = localStorage.getItem(USER_KEY);
    if (!userData) return null;

    try {
      return JSON.parse(userData) as User;
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    return api.hasToken() && !!this.getCurrentUser();
  }

  static async fetchCurrentUser(): Promise<User | null> {
    if (!api.hasToken()) return null;

    try {
      const user = await api.get<User>('/auth/me');
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch {
      // Token might be invalid, clear it
      api.clearToken();
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}
