import { Router } from 'express';
import { submitSupportRequest } from '../controllers/support.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Optional authentication: allow both authenticated students and general inquiry
router.post('/request', (req, res, next) => {
  if (req.headers.authorization) {
    authenticateToken(req, res, next);
  } else {
    next();
  }
}, submitSupportRequest);

export default router;
