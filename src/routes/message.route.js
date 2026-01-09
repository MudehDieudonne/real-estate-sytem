import express from 'express';
import { addMessage } from '../controllers/message.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Message management endpoints
 */

/**
 * @swagger
 * /api/messages/{chatId}:
 *   post:
 *     summary: Send a message
 *     description: Send a new message in a specific chat conversation. Requires authentication.
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the chat to send message to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: Hello! I'm interested in this property.
 *                 description: Message content
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 chatId:
 *                   type: string
 *                 text:
 *                   type: string
 *                 senderId:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Failed to send message
 */

const router = express.Router();

router.post('/:chatId', verifyToken, addMessage);

export default router;
