import express from 'express';
import {
  getUsers,
  updateUser,
  deleteUser,
  savePost,
  profilePosts,
} from '../controllers/user.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users with their basic information
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   avatar:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Failed to get users
 */

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user profile
 *     description: Update user information. Requires authentication. Users can only update their own profile.
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newemail@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: New password (optional, will be hashed)
 *               avatar:
 *                 type: string
 *                 example: https://example.com/avatar.jpg
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 avatar:
 *                   type: string
 *       403:
 *         description: Not authorized to update this user
 *       500:
 *         description: Failed to update user
 *   delete:
 *     summary: Delete user account
 *     description: Delete a user account. Requires authentication. Users can only delete their own account.
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted
 *       403:
 *         description: Not authorized to delete this user
 *       500:
 *         description: Failed to delete user
 */

/**
 * @swagger
 * /api/users/save:
 *   post:
 *     summary: Save or unsave a post
 *     description: Save a post to user's saved list or remove it if already saved. Requires authentication.
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *             properties:
 *               postId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *                 description: ID of the post to save/unsave
 *     responses:
 *       200:
 *         description: Post saved or removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Post saved
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to save post
 */

/**
 * @swagger
 * /api/users/profilePosts:
 *   get:
 *     summary: Get user's profile posts
 *     description: Retrieve user's own posts and saved posts. Requires authentication.
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User's posts and saved posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userPosts:
 *                   type: array
 *                   items:
 *                     type: object
 *                 savedPosts:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Failed to fetch profile posts
 */

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
