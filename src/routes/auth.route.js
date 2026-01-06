import e from 'express';
import { login, logout, register } from '../controller/auth.controller.js';

const router = e.Router();

// auth route register
router.post('/register', register);

// auth route login
router.post('/login', login);

// auth route logout
router.post('/logout', logout);

export default router;
