import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { submitApprovalRequest, getMyRequestStatus } from '../controllers/approval.controller.js';

const router = express.Router();

router.post('/submit', verifyToken, submitApprovalRequest);
router.get('/status', verifyToken, getMyRequestStatus);

export default router;
