/**
 * middleware/auth.ts
 * Verifies the Supabase access token on every protected route.
 * Sets req.userId only after cryptographic verification.
 * Never trusts a client-supplied user ID.
 *
 * Supports two modes (configured via env):
 *  A) SUPABASE_JWT_SECRET  – HS256 symmetric verification (faster, no network)
 *  B) SUPABASE_JWKS_URL    – RS256 JWKS verification (recommended for production)
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { env } from '../config/env';
import { AuthError } from '../utils/errors';
import { logger } from '../utils/logger';

// Augment Express Request to carry the verified userId
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Build the JWKS client once if using JWKS mode
const jwks = env.supabaseJwksUrl
  ? jwksClient({
      jwksUri: env.supabaseJwksUrl,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000, // 10 minutes
    })
  : null;

function getSigningKey(
  kid: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!jwks) return reject(new Error('JWKS client not initialised'));
    jwks.getSigningKey(kid, (err, key) => {
      if (err) return reject(err);
      const signingKey = key?.getPublicKey();
      if (!signingKey) return reject(new Error('No signing key found'));
      resolve(signingKey);
    });
  });
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AuthError('Missing or malformed Authorization header'));
  }

  const token = authHeader.slice(7);

  try {
    let decoded: jwt.JwtPayload;

    if (jwks) {
      // RS256 JWKS path
      const unverified = jwt.decode(token, { complete: true });
      if (!unverified || typeof unverified.header !== 'object') {
        throw new AuthError('Malformed token');
      }
      const kid = unverified.header.kid as string;
      const signingKey = await getSigningKey(kid);
      decoded = jwt.verify(token, signingKey, {
        algorithms: ['RS256'],
        issuer: env.supabaseUrl + '/auth/v1',
        audience: 'authenticated',
      }) as jwt.JwtPayload;
    } else {
      // HS256 symmetric secret path
      decoded = jwt.verify(token, env.supabaseJwtSecret, {
        algorithms: ['HS256'],
        issuer: env.supabaseUrl + '/auth/v1',
        audience: 'authenticated',
      }) as jwt.JwtPayload;
    }

    const userId = decoded.sub;
    if (!userId || typeof userId !== 'string') {
      throw new AuthError('Token does not contain a valid user identifier');
    }

    req.userId = userId;
    next();
  } catch (err) {
    logger.warn('Token verification failed', {
      error: err instanceof Error ? err.message : 'unknown',
    });

    if (err instanceof AuthError) {
      return next(err);
    }
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AuthError('Token has expired'));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new AuthError('Invalid token'));
    }
    next(new AuthError('Authentication failed'));
  }
}
