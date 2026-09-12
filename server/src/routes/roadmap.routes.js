import { Router } from 'express';
import { getRoadmap, generateRoadmap, toggleMilestone } from '../controllers/roadmap.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);
router.get('/', getRoadmap);
router.post('/generate', generateRoadmap);
router.patch('/milestones/:itemId/toggle', toggleMilestone);

export default router;
