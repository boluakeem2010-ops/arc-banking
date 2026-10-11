import type { DashboardSummary, TransferInput, TransferResult } from './types';

export type AuthUser = {
  name: string;
  email: string;
};

export type AuthResult = {
  user: AuthUser;
};

export type PasswordResetResult = {
  message: string;
  resetToken: string;
};

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new ApiError(result.error ?? `Request failed (${response.status}).`, response.status);
  }

  return result;
}

export function getCurrentUser(): Promise<AuthResult> {
  return request<AuthResult>('/api/auth/me');
}

export function startDemoSession(): Promise<AuthResult> {
  return request<AuthResult>('/api/demo-session', { method: 'POST' });
}

export function signIn(email: string, password: string): Promise<AuthResult> {
  return request<AuthResult>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function signUp(name: string, email: string, password: string): Promise<AuthResult> {
  return request<AuthResult>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function signOut(): Promise<void> {
  await request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
}

export function requestPasswordReset(email: string): Promise<PasswordResetResult> {
  return request<PasswordResetResult>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(email: string, token: string, password: string): Promise<void> {
  return request<void>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, token, password }),
  });
}

export function getSummary(): Promise<DashboardSummary> {
  return request<DashboardSummary>('/api/summary');
}

export function createTransfer(input: TransferInput): Promise<TransferResult> {
  return request<TransferResult>('/api/transfers', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function resetDemo(): Promise<DashboardSummary> {
  return request<DashboardSummary>('/api/reset-demo', { method: 'POST' });
}
