import { Router } from 'express';
import {
  getAdminStats,
  getStudents,
  getStudentDetail,
  createCourse,
  updateCourse,
  deleteCourse,
  getAdminCareers,
  createCareer,
  updateCareer,
  deleteCareer,
  addCareerSkill,
  updateCareerSkill,
  removeCareerSkill,
} from '../controllers/admin.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

// ENFORCE BACKEND AUTH & STRICT ADMIN ROLE REQUIREMENT
router.use(authenticateToken);
router.use(requireRole('admin'));

// Stats & Roster
router.get('/stats', getAdminStats);
router.get('/students', getStudents);
router.get('/students/:id', getStudentDetail);

// Course Management CRUD
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Career & Skill Requirements CRUD
router.get('/careers', getAdminCareers);
router.post('/careers', createCareer);
router.put('/careers/:id', updateCareer);
router.delete('/careers/:id', deleteCareer);
router.post('/careers/:careerId/skills', addCareerSkill);
router.put('/careers/:careerId/skills/:skillId', updateCareerSkill);
router.delete('/careers/:careerId/skills/:skillId', removeCareerSkill);

export default router;
