/**
 * Authentication Service
 * Handles user registration, login, and token management
 */

import { apiClient } from './client';

export interface AuthRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  subscriptionTier: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

/**
 * Register a new user
 */
export async function register(email: string, password: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', {
    email,
    password,
  });

  // Store tokens in localStorage
  if (response) {
    localStorage.setItem('auth', JSON.stringify(response));
  }

  return response;
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', {
    email,
    password,
  });

  // Store tokens in localStorage
  if (response) {
    localStorage.setItem('auth', JSON.stringify(response));
  }

  return response;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(): Promise<AuthResponse> {
  const authData = localStorage.getItem('auth');
  if (!authData) {
    throw new Error('No auth data found');
  }

  const { refreshToken } = JSON.parse(authData);
  if (!refreshToken) {
    throw new Error('No refresh token found');
  }

  const response = await apiClient.post<AuthResponse>('/auth/refresh', {
    refreshToken,
  });

  // Update stored tokens
  if (response) {
    localStorage.setItem('auth', JSON.stringify(response));
  }

  return response;
}

/**
 * Logout user (client-side only - JWT is stateless)
 */
export function logout(): void {
  localStorage.removeItem('auth');
}

/**
 * Get current user from stored auth data
 */
export function getCurrentUser(): User | null {
  const authData = localStorage.getItem('auth');
  if (!authData) return null;

  try {
    const parsed: AuthResponse = JSON.parse(authData);
    return parsed.user || null;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const authData = localStorage.getItem('auth');
  if (!authData) return false;

  try {
    const parsed: AuthResponse = JSON.parse(authData);
    return !!parsed.accessToken;
  } catch {
    return false;
  }
}

export const authService = {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  isAuthenticated,
};

export default authService;
