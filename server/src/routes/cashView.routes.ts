import { Router } from 'express';
import { getCashSessions, getCashSessionStats } from '../controllers/cashView.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/cash/sessions
 * @desc Get cash sessions with transaction details
 * @access Private (role-based filtering)
 */
router.get('/sessions', getCashSessions);

/**
 * @route GET /api/cash/stats
 * @desc Get cash session statistics and financial summaries
 * @access Private (role-based filtering)
 */
router.get('/stats', getCashSessionStats);

export default router;