import { Router } from 'express';
import { getLearningPlan, generateLearningPlan, togglePlanItem } from '../controllers/learningplan.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);
router.get('/', getLearningPlan);
router.post('/generate', generateLearningPlan);
router.patch('/items/:itemId/toggle', togglePlanItem);

export default router;
