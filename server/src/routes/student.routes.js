import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getCourses,
  addCourse,
  updateCourseStatus,
  deleteCourse,
  getSkills,
  addSkill,
  updateSkill,
  deleteSkill,
  getDashboardSummary,
  getAvailableCareers,
  getAvailableCourses,
  getAvailableSkills,
} from '../controllers/student.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Public / options lookup
router.get('/meta/careers', getAvailableCareers);
router.get('/meta/courses', getAvailableCourses);
router.get('/meta/skills', getAvailableSkills);

// Protected student routes
router.use(authenticateToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/dashboard', getDashboardSummary);

// Student courses
router.get('/courses', getCourses);
router.post('/courses', addCourse);
router.put('/courses/:id', updateCourseStatus);
router.delete('/courses/:id', deleteCourse);

// Student skills
router.get('/skills', getSkills);
router.post('/skills', addSkill);
router.put('/skills/:id', updateSkill);
router.delete('/skills/:id', deleteSkill);

export default router;
