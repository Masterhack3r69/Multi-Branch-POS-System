import { Router } from 'express';
import { createSale, refundSale, getSales } from '../controllers/sale.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getSales);
router.post('/', authenticate, createSale);
router.post('/:id/refund', authenticate, refundSale);

export default router;
