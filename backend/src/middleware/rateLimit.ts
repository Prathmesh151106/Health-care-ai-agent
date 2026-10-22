/**
 * middleware/rateLimit.ts
 * General rate limiter and a stricter limiter for the AI endpoint.
 * Uses express-rate-limit with in-memory store (suitable for single instance).
 */

import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const windowMs = env.rateLimitWindowMs;

export const generalRateLimit = rateLimit({
  windowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  skipFailedRequests: false,
});

export const aiRateLimit = rateLimit({
  windowMs,
  max: env.aiRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'AI rate limit exceeded. Please wait before sending more requests.',
    code: 'AI_RATE_LIMIT_EXCEEDED',
  },
});

/** Strict limit for auth-sensitive endpoints (token refresh, etc.) */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
});
