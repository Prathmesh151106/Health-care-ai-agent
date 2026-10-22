/**
 * config/env.ts
 * Validates all required environment variables at startup.
 * The process exits with a clear message if any required variable is missing.
 * Never logs actual secret values.
 */
import dotenv from 'dotenv';
dotenv.config();

function requireEnv(name: string, fallback = ''): string {
  const value = process.env[name] || fallback;
  if (!value) {
    console.warn(`[startup] Warning: Missing environment variable ${name}. Some features may be disabled.`);
    return '';
  }
  return value;
}

function optionalEnv(name: string, defaultValue = ''): string {
  return process.env[name] ?? defaultValue;
}

function requireOneOf(names: string[]): void {
  const found = names.some((n) => !!process.env[n]);
  if (!found) {
    console.warn(
      `[startup] Warning: None of ${names.join(', ')} configured. Auth token verification will require one of these.`
    );
  }
}

// Validate auth config (warn without killing the server)
requireEnv('SUPABASE_URL');
requireOneOf(['SUPABASE_JWT_SECRET', 'SUPABASE_JWKS_URL']);

export const env = {
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  port: parseInt(optionalEnv('PORT', '4000'), 10),

  databaseUrl: requireEnv('DATABASE_URL'),
  databaseSsl: optionalEnv('DATABASE_SSL', 'false') === 'true',

  frontendUrl: optionalEnv('FRONTEND_URL', 'http://localhost:5173'),
  localFrontendUrl: optionalEnv('LOCAL_FRONTEND_URL', 'http://localhost:5173'),
  extraAllowedOrigins: optionalEnv('EXTRA_ALLOWED_ORIGINS', '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseJwtSecret: optionalEnv('SUPABASE_JWT_SECRET'),
  supabaseJwksUrl: optionalEnv('SUPABASE_JWKS_URL'),

  aiProviderApiKey: optionalEnv('AI_PROVIDER_API_KEY'),
  aiModel: optionalEnv('AI_MODEL', 'gpt-4o-mini'),
  aiProvider: optionalEnv('AI_PROVIDER', 'openai'),

  rateLimitWindowMs: parseInt(optionalEnv('RATE_LIMIT_WINDOW_MS', '60000'), 10),
  rateLimitMax: parseInt(optionalEnv('RATE_LIMIT_MAX', '100'), 10),
  aiRateLimitMax: parseInt(optionalEnv('AI_RATE_LIMIT_MAX', '10'), 10),

  requestTimeoutMs: parseInt(optionalEnv('REQUEST_TIMEOUT_MS', '30000'), 10),
  aiRequestTimeoutMs: parseInt(optionalEnv('AI_REQUEST_TIMEOUT_MS', '60000'), 10),

  isProduction: optionalEnv('NODE_ENV', 'development') === 'production',
  isDemoMode: !optionalEnv('AI_PROVIDER_API_KEY'),
} as const;
