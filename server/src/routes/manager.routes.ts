import { Router } from 'express';
import { getManagerDashboardStats } from '../controllers/manager.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Apply role-based authorization for manager routes
router.use(authorize(['ADMIN', 'MANAGER']));

/**
 * @route GET /api/manager/dashboard
 * @desc Get dashboard stats for manager (branch-specific only)
 * @access Manager only
 */
router.get('/dashboard', getManagerDashboardStats);

export default router;