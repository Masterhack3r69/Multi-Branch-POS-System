import { Router } from 'express';
import { getSalesReport, getInventoryReport, getDashboardStats } from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'MANAGER'])); // Only management can see reports

router.get('/dashboard', getDashboardStats);
router.get('/sales', getSalesReport);
router.get('/inventory', getInventoryReport);

export default router;
