import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
  getPosts,
  getPost,
  addPost,
  updatePost,
  deletePost,
} from '../controllers/post.controller.js';

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Real estate property post management endpoints
 */

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts with filtering
 *     description: Retrieve all property posts with optional filtering by city, type, property, bedroom count, and price range
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [rent, sale]
 *         description: Filter by property type (rent or sale)
 *       - in: query
 *         name: property
 *         schema:
 *           type: string
 *         description: Filter by property type (apartment, house, etc.)
 *       - in: query
 *         name: bedroom
 *         schema:
 *           type: integer
 *         description: Filter by number of bedrooms
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: integer
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: integer
 *         description: Maximum price filter
 *     responses:
 *       200:
 *         description: List of posts matching the filter criteria
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   price:
 *                     type: number
 *                   city:
 *                     type: string
 *                   type:
 *                     type: string
 *                   property:
 *                     type: string
 *                   bedroom:
 *                     type: integer
 *                   userId:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Failed to get posts
 *   post:
 *     summary: Create a new post
 *     description: Create a new property listing. Requires authentication.
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - price
 *               - city
 *               - type
 *               - property
 *             properties:
 *               title:
 *                 type: string
 *                 example: Beautiful Family Home
 *               description:
 *                 type: string
 *                 example: Spacious 3-bedroom home in a quiet neighborhood
 *               price:
 *                 type: number
 *                 example: 250000
 *               city:
 *                 type: string
 *                 example: New York
 *               type:
 *                 type: string
 *                 enum: [rent, sale]
 *                 example: sale
 *               property:
 *                 type: string
 *                 example: apartment
 *               bedroom:
 *                 type: integer
 *                 example: 3
 *               bathroom:
 *                 type: integer
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 userId:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Error creating post
 */

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get a single post
 *     description: Retrieve detailed information about a specific property post including post details and user info. Shows if logged-in user has saved this post.
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 price:
 *                   type: number
 *                 city:
 *                   type: string
 *                 type:
 *                   type: string
 *                 property:
 *                   type: string
 *                 bedroom:
 *                   type: integer
 *                 postDetail:
 *                   type: object
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                 isSaved:
 *                   type: boolean
 *       401:
 *         description: Invalid token
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to get post
 *   put:
 *     summary: Update a post
 *     description: Update an existing post. Requires authentication. Only the post owner can update.
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               city:
 *                 type: string
 *               type:
 *                 type: string
 *               property:
 *                 type: string
 *               bedroom:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       403:
 *         description: Not authorized to update this post
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to update post
 *   delete:
 *     summary: Delete a post
 *     description: Delete a property post. Requires authentication. Only the post owner can delete.
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID to delete
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       403:
 *         description: Not authorized to delete this post
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to delete post
 */

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
