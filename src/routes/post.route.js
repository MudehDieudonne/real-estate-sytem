import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
  getPosts,
  getPost,
  addPost,
  updatePost,
  deletePost,
} from '../controllers/post.controller.js';

const router = express.Router();

router.get('/', getPosts);

// Get a single post by ID
router.get('/:id', getPost);

// Add a new post
router.post('/', verifyToken, addPost);

// Update a post
router.put('/:id', verifyToken, updatePost);

// Delete a post
router.delete('/:id', verifyToken, deletePost);

export default router;
