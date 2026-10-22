import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

export const supabase: SupabaseClient | null = env.hasSupabase
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
