import e from 'express';
import { getUsers, getUser, updateUser, deleteUser } from '../controller/user.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = e.Router();

router.get('/', getUsers);

// get user by id route
router.get('/:id', verifyToken, getUser);

// update route
router.put('/:id', verifyToken, updateUser);

// Delete route
router.delete('/:id', verifyToken, deleteUser);

export default router;
