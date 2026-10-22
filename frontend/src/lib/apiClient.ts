/**
 * lib/apiClient.ts
 * Express backend fetch wrapper.
 * - Injects Supabase access token (Bearer)
 * - 3.5s cold-start detection banner trigger
 * - 60s timeout with retry support
 * - Silent 401 refresh with session-expired notification
 * - 429 friendly rate-limit messages
 * - Clean JSON error parsing without stack traces
 */

import { env } from '../config/env';
import { supabase } from './supabaseClient';

export interface ColdStartListener {
  (isPending: boolean): void;
}

const coldStartListeners: Set<ColdStartListener> = new Set();

export function onColdStartStatusChange(listener: ColdStartListener): () => void {
  coldStartListeners.add(listener);
  return () => coldStartListeners.delete(listener);
}

function notifyColdStart(status: boolean) {
  coldStartListeners.forEach((fn) => fn(status));
}

let activeRequests = 0;
let coldStartTimer: any = null;

function startRequestTracker() {
  activeRequests++;
  if (activeRequests === 1) {
    coldStartTimer = setTimeout(() => {
      notifyColdStart(true);
    }, 3500);
  }
}

function stopRequestTracker() {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0) {
    if (coldStartTimer) {
      clearTimeout(coldStartTimer);
      coldStartTimer = null;
    }
    notifyColdStart(false);
  }
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ?? null;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 1
): Promise<T> {
  const url = `${env.apiBaseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  startRequestTracker();

  try {
    let token = await getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    let res: Response;
    try {
      res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new ApiError('The server took too long to respond. Please check your connection and try again.', 408);
      }
      if (retries > 0) {
        return await apiRequest<T>(endpoint, options, retries - 1);
      }
      throw new ApiError('Network connection failed. Please check your internet or retry.', 0);
    } finally {
      clearTimeout(timeoutId);
    }

    // Handle 401 Unauthorized – attempt one silent token refresh
    if (res.status === 401 && supabase) {
      const refreshResult = await supabase.auth.refreshSession();
      const newToken = refreshResult.data?.session?.access_token;
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryRes = await fetch(url, { ...options, headers });
        if (retryRes.ok) {
          return await retryRes.json();
        }
      }
      throw new ApiError('Your session has expired. Please sign in again to continue.', 401, 'UNAUTHORIZED');
    }

    // Handle 429 Too Many Requests
    if (res.status === 429) {
      throw new ApiError('Too many requests right now. Please wait a moment and try again.', 429, 'RATE_LIMITED');
    }

    // Handle error responses
    if (!res.ok) {
      let errorJson: any = null;
      try {
        errorJson = await res.json();
      } catch {
        // Not a JSON response
      }

      const message = errorJson?.error?.message || errorJson?.message || `Request failed with status ${res.status}`;
      const code = errorJson?.error?.code || errorJson?.code;
      throw new ApiError(message, res.status, code, errorJson?.error?.details);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return await res.json();
  } finally {
    stopRequestTracker();
  }
}
