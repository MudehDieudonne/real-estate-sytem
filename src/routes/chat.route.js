import express from 'express';
import { getChats, getChat, addChat, readChat } from '../controllers/chat.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

/**
 * @swagger
 * tags:
 *   name: Chats
 *   description: Chat and messaging endpoints
 */

/**
 * @swagger
 * /api/chats:
 *   get:
 *     summary: Get all chats for current user
 *     description: Retrieve all conversations for the authenticated user
 *     tags: [Chats]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of user's chats
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   participants:
 *                     type: array
 *                     items:
 *                       type: object
 *                   lastMessage:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   isRead:
 *                     type: boolean
 *       401:
 *         description: Unauthorized - authentication token required
 *       500:
 *         description: Failed to fetch chats
 *   post:
 *     summary: Create a new chat
 *     description: Start a new conversation with another user
 *     tags: [Chats]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *             properties:
 *               receiverId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *                 description: ID of the user to start chat with
 *     responses:
 *       201:
 *         description: Chat created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 participants:
 *                   type: array
 *                   items:
 *                     type: object
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input or chat already exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to create chat
 */

/**
 * @swagger
 * /api/chats/{id}:
 *   get:
 *     summary: Get a specific chat
 *     description: Retrieve details of a specific chat conversation with message history
 *     tags: [Chats]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Chat details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 participants:
 *                   type: array
 *                   items:
 *                     type: object
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                 isRead:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Failed to fetch chat
 *   put:
 *     summary: Mark chat as read
 *     description: Mark a chat conversation as read
 *     tags: [Chats]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Chat ID to mark as read
 *     responses:
 *       200:
 *         description: Chat marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Chat marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Failed to update chat
 */

const router = express.Router();

// Get all chats for a user
router.get('/', verifyToken, getChats);

// Get a single chat by ID
router.get('/:id', verifyToken, getChat);

// Add a new chat
router.post('/', verifyToken, addChat);

// Mark chat as read
router.put('/:id', verifyToken, readChat);
router.put('/read/:id', verifyToken, readChat);

export default router;
