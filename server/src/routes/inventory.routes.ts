import { Router } from 'express';
import { adjustStock, getStockHistory, getLowStock, getStockLevels } from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middleware/auth.middleware'; // Assuming these exist

const router = Router();

router.post('/adjust', authenticate, authorize(['MANAGER', 'ADMIN']), adjustStock);
router.get('/history', authenticate, authorize(['MANAGER', 'ADMIN']), getStockHistory);
router.get('/low-stock', authenticate, authorize(['MANAGER', 'ADMIN']), getLowStock);
router.get('/levels', authenticate, authorize(['MANAGER', 'ADMIN', 'CASHIER']), getStockLevels);

export default router;
