import { Router } from 'express';
import { adjustStock, getStockHistory } from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middleware/auth.middleware'; // Assuming these exist

const router = Router();

router.post('/adjust', authenticate, authorize(['MANAGER', 'ADMIN']), adjustStock);
router.get('/history', authenticate, authorize(['MANAGER', 'ADMIN']), getStockHistory);

export default router;
