import { prisma } from '../lib/prisma.js';

export const submitApprovalRequest = async (req, res) => {
  const userId = req.userId;
  const { message } = req.body;

  try {
    // Check if user already has an active request
    const existingRequest = await prisma.approvalRequest.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending approval request.' });
    }

    const newRequest = await prisma.approvalRequest.create({
      data: {
        userId,
        message,
      },
    });

    res.status(201).json(newRequest);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit approval request', error: err.message });
  }
};

export const getMyRequestStatus = async (req, res) => {
  const userId = req.userId;
  try {
    const request = await prisma.approvalRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(request || { status: 'NONE' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch request status', error: err.message });
  }
};
