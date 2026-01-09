import express from 'express';
import {
  getUsers,
  updateUser,
  deleteUser,
  savePost,
  profilePosts,
} from '../controller/user.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.get('/', getUsers);

// router.get("/search/:id", verifyToken, getUser);
router.put('/:id', verifyToken, updateUser);

// Delete a user
router.delete('/:id', verifyToken, deleteUser);

// Save a post
router.post('/save', verifyToken, savePost);

router.get('/profilePosts', verifyToken, profilePosts);

export default router;
