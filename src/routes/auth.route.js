import e from 'express';
import {
  login,
  logout,
  me,
  oauthCallback,
  oauthStart,
  register,
  resendOtp,
  verifyOtp,
  verifyFirebasePhone,
} from '../controllers/auth.controller.js';
import rateLimit from 'express-rate-limit';
import { verifyToken } from '../middleware/verifyToken.js';

// Apply rate limiting to authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Use the rate limiter for all auth routes

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints includes registration, login, and logout
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with username, email, and password. Password is hashed before storage.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: tazoh clifford
 *                 description: Unique username for the account
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@gmail.com
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePassword123
 *                 description: User's password (will be hashed)
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Invalid input or user already exists
 *       500:
 *         description: Server error - Failed to create user
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user with username and password. Returns user data and sets authentication cookie.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *                 description: User's username
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePassword123
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Max-Age=604800
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 avatar:
 *                   type: string
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid Credentials!
 *       500:
 *         description: Server error - Failed to login
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Clear authentication cookie and logout the user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: token=; Max-Age=0
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       500:
 *         description: Server error
 */

const router = e.Router();

// auth route register
router.post('/register', authLimiter, register);

// auth route login
router.post('/login', authLimiter, login);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/verify-firebase', authLimiter, verifyFirebasePhone);
router.post('/resend-otp', authLimiter, resendOtp);

// Keep old routes for backward compatibility if needed (optional)
router.post('/verify-email-otp', authLimiter, verifyOtp);
router.post('/resend-email-otp', authLimiter, resendOtp);

// auth route logout
router.post('/logout', logout);
router.get('/me', verifyToken, me);
router.get('/oauth/:provider/start', oauthStart);
router.get('/oauth/:provider/callback', oauthCallback);

export default router;
