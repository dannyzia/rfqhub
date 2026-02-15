import { browser } from '$app/environment';
import { goto } from '$app/navigation';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiError {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
  retryAfter?: number;
  retryAfterSeconds?: number;
}

interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (!browser) return null;
    return localStorage.getItem('accessToken');
  }

  private async refreshToken(): Promise<string | null> {
    if (!browser) return null;

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data.accessToken;
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return null;
    }
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      ...options,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    let response = await fetch(`${this.baseUrl}${endpoint}`, config);

    // Handle token refresh on 401
    if (response.status === 401 && browser) {
      const newToken = await this.refreshToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        config.headers = headers;
        response = await fetch(`${this.baseUrl}${endpoint}`, config);
      } else {
        goto('/login');
        throw new Error('Session expired');
      }
    }

    const data = await response.json();

    if (!response.ok) {
      // Handle rate limiting with user-friendly message
      if (response.status === 429) {
        const retryAfter = data.error?.retryAfter || data.error?.retryAfterSeconds || 60;
        const minutes = Math.ceil(retryAfter / 60);
        const error: ApiError = {
          code: 'RATE_LIMITED',
          message: retryAfter > 60 
            ? `Too many requests. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
            : `Too many requests. Please try again in ${retryAfter} seconds.`,
          retryAfter,
          retryAfterSeconds: retryAfter
        };
        throw error;
      }
      
      const error = data.error || { code: 'UNKNOWN_ERROR', message: 'An error occurred' };
      throw error;
    }

    // Unwrap the data object from the API response
    return (data.data || data) as T;
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('POST', endpoint, body, options);
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  async uploadFile<T>(endpoint: string, file: File, fieldName: string = 'file'): Promise<T> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append(fieldName, file);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw data.error || { code: 'UPLOAD_ERROR', message: 'File upload failed' };
    }

    return data as T;
  }
}

export const api = new ApiClient(API_BASE_URL);
