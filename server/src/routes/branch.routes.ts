import { Router } from 'express';
import { getBranches, createBranch, getBranchTerminals, updateBranch, disableBranch } from '../controllers/branch.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getBranches);
router.post('/', authenticate, authorize(['ADMIN']), createBranch);
router.patch('/:id', authenticate, authorize(['ADMIN']), updateBranch);
router.post('/:id/disable', authenticate, authorize(['ADMIN']), disableBranch);
router.get('/:id/terminals', authenticate, getBranchTerminals);

export default router;
