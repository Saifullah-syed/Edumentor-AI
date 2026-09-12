import { Router } from 'express';
import { getConversation, sendMessage, clearConversation } from '../controllers/advisor.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);
router.get('/conversation', getConversation);
router.post('/message', sendMessage);
router.delete('/conversation', clearConversation);

export default router;
