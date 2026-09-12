import { Router } from 'express';
import { getSkillGapAnalysis } from '../controllers/skillgap.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);
router.get('/', getSkillGapAnalysis);

export default router;
