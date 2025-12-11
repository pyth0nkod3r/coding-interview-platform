// src/utils/api.ts
// HTTP client for backend API communication

const API_BASE_URL = 'http://localhost:3001/api/v1';
const TOKEN_KEY = 'auth_token';

export interface ApiError {
    message: string;
    code?: string;
}

class ApiClient {
    private getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    setToken(token: string): void {
        localStorage.setItem(TOKEN_KEY, token);
    }

    clearToken(): void {
        localStorage.removeItem(TOKEN_KEY);
    }

    hasToken(): boolean {
        return !!this.getToken();
    }

    private async request<T>(
        method: string,
        endpoint: string,
        body?: unknown
    ): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        // Handle 204 No Content
        if (response.status === 204) {
            return undefined as T;
        }

        const data = await response.json();

        if (!response.ok) {
            const error = data as ApiError;
            throw new Error(error.message || 'Request failed');
        }

        return data as T;
    }

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>('GET', endpoint);
    }

    async post<T>(endpoint: string, body?: unknown): Promise<T> {
        return this.request<T>('POST', endpoint, body);
    }

    async put<T>(endpoint: string, body?: unknown): Promise<T> {
        return this.request<T>('PUT', endpoint, body);
    }

    async patch<T>(endpoint: string, body?: unknown): Promise<T> {
        return this.request<T>('PATCH', endpoint, body);
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>('DELETE', endpoint);
    }
}

export const api = new ApiClient();
