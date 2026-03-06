import { prisma } from '../lib/prisma.js';

export const getApprovalRequests = async (req, res) => {
  try {
    const requests = await prisma.approvalRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch approval requests', error: err.message });
  }
};

export const approveUser = async (req, res) => {
  const { requestId } = req.params;
  try {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({ message: 'Approval request not found' });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: request.userId },
        data: { isApproved: true },
      }),
      prisma.approvalRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      }),
    ]);

    res.status(200).json({ message: 'User approved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve user', error: err.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const [userCount, postCount, pendingRequestCount] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.approvalRequest.count({ where: { status: 'PENDING' } }),
    ]);

    // Get recent activities (simplified)
    const recentPosts = await prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { username: true },
        },
      },
    });

    res.status(200).json({
      stats: {
        userCount,
        postCount,
        pendingRequestCount,
      },
      recentPosts,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch dashboard stats', error: err.message });
  }
};
