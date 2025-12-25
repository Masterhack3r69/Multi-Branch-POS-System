import { Router } from 'express';
import { createSale } from '../controllers/sale.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, createSale);

export default router;
