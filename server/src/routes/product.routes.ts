import { Router } from 'express';
import { getProducts, createProduct } from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getProducts);
router.post('/', authenticate, authorize(['ADMIN', 'MANAGER']), createProduct);

export default router;
