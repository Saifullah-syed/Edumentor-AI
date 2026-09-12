import { Router } from 'express';
import authRoutes from './auth.routes.js';
import studentRoutes from './student.routes.js';
import advisorRoutes from './advisor.routes.js';
import roadmapRoutes from './roadmap.routes.js';
import skillgapRoutes from './skillgap.routes.js';
import learningPlanRoutes from './learningplan.routes.js';
import resumeRoutes from './resume.routes.js';
import adminRoutes from './admin.routes.js';
import supportRoutes from './support.routes.js';
import { getDbInfo } from '../db/index.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  const dbInfo = getDbInfo();
  res.status(200).json({
    status: 'online',
    appName: 'EduMentor AI Backend Service',
    timestamp: new Date().toISOString(),
    database: dbInfo,
  });
});

// Mount modular sub-routes
router.use('/auth', authRoutes);
router.use('/student', studentRoutes);
router.use('/advisor', advisorRoutes);
router.use('/roadmap', roadmapRoutes);
router.use('/skillgap', skillgapRoutes);
router.use('/learningplan', learningPlanRoutes);
router.use('/learning-plan', learningPlanRoutes);
router.use('/resume', resumeRoutes);
router.use('/admin', adminRoutes);
router.use('/support', supportRoutes);

export default router;
