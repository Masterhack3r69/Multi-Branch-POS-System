import { Router } from 'express';
import { getBranches, createBranch, getBranchTerminals } from '../controllers/branch.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getBranches);
router.post('/', authenticate, authorize(['ADMIN']), createBranch);
router.get('/:id/terminals', authenticate, getBranchTerminals);

export default router;
