/**
 * config/env.ts
 * Validates Vite environment variables.
 * Never throws or crashes the frontend.
 * Gracefully defaults to demo mode if VITE_API_BASE_URL is absent.
 */

export interface FrontendEnv {
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  isDemoMode: boolean;
  hasSupabase: boolean;
}

const rawApiUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim();
// Strip trailing slash if present
const apiBaseUrl = rawApiUrl.replace(/\/+$/, '');

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

export const env: FrontendEnv = {
  apiBaseUrl,
  supabaseUrl,
  supabaseAnonKey,
  isDemoMode: !apiBaseUrl,
  hasSupabase: Boolean(supabaseUrl && supabaseAnonKey && !supabaseAnonKey.includes('placeholder'))
};
