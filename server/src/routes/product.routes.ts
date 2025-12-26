import { Router } from 'express';
import { getProducts, createProduct, updateProduct, disableProduct } from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getProducts);
router.post('/', authenticate, authorize(['ADMIN', 'MANAGER']), createProduct);
router.patch('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), updateProduct);
router.post('/:id/disable', authenticate, authorize(['ADMIN', 'MANAGER']), disableProduct);

export default router;
