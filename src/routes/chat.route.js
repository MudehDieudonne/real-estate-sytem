import express from 'express';
import { getChats, getChat, addChat, readChat } from '../controllers/chat.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Get all chats for a user
router.get('/', verifyToken, getChats);

// Get a single chat by ID
router.get('/:id', verifyToken, getChat);

// Add a new chat
router.post('/', verifyToken, addChat);

// Mark chat as read
router.put('/read/:id', verifyToken, readChat);

export default router;
