import e from 'express';
import { login, logout, register } from '../controller/auth.controller.js';
import rateLimit from 'express-rate-limit';

// Apply rate limiting to authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Use the rate limiter for all auth routes

const router = e.Router();

// auth route register
router.post('/register', authLimiter, register);

// auth route login
router.post('/login', authLimiter, login);

// auth route logout
router.post('/logout', logout);

export default router;
