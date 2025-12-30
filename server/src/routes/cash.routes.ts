import { Router } from 'express';
import { getSession, startSession, endSession, addTransaction, getSessionSales } from '../controllers/cash.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/session', getSession);
router.get('/sales-for-session', getSessionSales);
router.post('/session/start', startSession);
router.post('/session/end', endSession);
router.post('/transaction', addTransaction);

export default router;
