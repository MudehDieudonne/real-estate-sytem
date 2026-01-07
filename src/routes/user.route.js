import express from 'express';
import { getUsers, getUser, updateUser, deleteUser } from '../controller/user.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.get('/', getUsers);
router.get('/search/:id', verifyToken, getUser);
// router.get("/search/:id", verifyToken, getUser);
router.put('/:id', verifyToken, updateUser);
router.delete('/:id', verifyToken, deleteUser);

export default router;
