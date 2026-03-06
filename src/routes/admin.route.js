import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
  getApprovalRequests,
  approveUser,
  getDashboardStats,
} from '../controllers/admin.controller.js';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPREME_ADMIN') {
    return res.status(403).json({ message: 'Require Admin Role!' });
  }
  next();
};

router.get('/requests', verifyToken, isAdmin, getApprovalRequests);
router.post('/approve/:requestId', verifyToken, isAdmin, approveUser);
router.get('/stats', verifyToken, isAdmin, getDashboardStats);

export default router;
