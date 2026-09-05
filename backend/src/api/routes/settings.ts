import { Router } from 'express';
import { getSettings, updateSettings } from '../../repositories/settingsRepository';
import { asyncRoute } from '../../middleware/errorHandler';
import { updateSettingsSchema } from '../schemas';

export const settingsRouter = Router();

settingsRouter.get(
  '/settings',
  asyncRoute(async (req, res) => {
    res.json(await getSettings(req.userId));
  }),
);

settingsRouter.patch(
  '/settings',
  asyncRoute(async (req, res) => {
    const patch = updateSettingsSchema.parse(req.body);
    res.json(await updateSettings(req.userId, patch));
  }),
);
