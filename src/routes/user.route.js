import express from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  savePost,
} from '../controller/user.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.get('/', getUsers);
router.get('/search/:id', verifyToken, getUser);
// router.get("/search/:id", verifyToken, getUser);
router.put('/:id', verifyToken, updateUser);
router.delete('/:id', verifyToken, deleteUser);
// Save a post
router.post('/save/:id', verifyToken, savePost);

export default router;
