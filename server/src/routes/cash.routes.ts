import { Router } from 'express';
import { getSession, startSession, endSession, addTransaction } from '../controllers/cash.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/session', getSession);
router.post('/session/start', startSession);
router.post('/session/end', endSession);
router.post('/transaction', addTransaction);

export default router;
