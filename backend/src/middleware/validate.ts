/**
 * middleware/validate.ts
 * Zod validation middleware factory.
 * Returns a consistent 400 response on schema failure.
 * Never includes internal details in the response.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

type Target = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, target: Target = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const issues = (result.error as ZodError).issues.map((issue) => ({
        path:    issue.path.join('.'),
        message: issue.message,
      }));
      res.status(400).json({
        error:   'Validation failed',
        code:    'VALIDATION_ERROR',
        details: issues,
      });
      return;
    }
    req[target] = result.data;
    next();
  };
}
