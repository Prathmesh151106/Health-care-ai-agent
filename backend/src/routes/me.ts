/**
 * routes/me.ts
 * Profile and preferences endpoints.
 * All routes require a verified auth token.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { UpdateProfileSchema, UpdatePreferencesSchema } from '../schemas';
import * as profileRepo from '../repositories/profileRepo';
import * as preferencesRepo from '../repositories/preferencesRepo';

export const meRouter = Router();

meRouter.use(requireAuth);

// GET /api/v1/me
meRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await profileRepo.findOrCreateProfile(req.userId!);
    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/me
meRouter.patch(
  '/',
  validate(UpdateProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await profileRepo.updateProfile(req.userId!, req.body);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/me/preferences
meRouter.get('/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Ensure profile exists first
    await profileRepo.findOrCreateProfile(req.userId!);
    const prefs = await preferencesRepo.getOrCreatePreferences(req.userId!);
    res.json({ data: prefs });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/me/preferences
meRouter.patch(
  '/preferences',
  validate(UpdatePreferencesSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await profileRepo.findOrCreateProfile(req.userId!);
      const updated = await preferencesRepo.updatePreferences(req.userId!, req.body);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);
