import { Router } from 'express';
import { getAllUsers, createUser, updateUser, toggleUserStatus } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All user management routes require ADMIN role
router.use(authenticate, authorize(['ADMIN']));

router.get('/', getAllUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.post('/:id/disable', toggleUserStatus);

export default router;
