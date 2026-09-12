import { Router } from 'express';
import { uploadAndAnalyze, getResumeHistory, getAnalysisDetail } from '../controllers/resume.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { uploadResume } from '../middleware/upload.middleware.js';

const router = Router();

router.use(authenticateToken);
router.post('/upload', uploadResume, uploadAndAnalyze);
router.get('/history', getResumeHistory);
router.get('/:id', getAnalysisDetail);

export default router;
