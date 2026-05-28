import prisma from '../lib/prisma.js';

// Get all chats for the authenticated user
export const getChats = async (req, res) => {
  // Extract user ID from the authentication token
  const tokenUserId = req.userId;

  // Fetch chats involving the authenticated user
  try {
    // Find chats where the user is a participant
    const chats = await prisma.chat.findMany({
      where: {
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // For each chat, find the other participant's details
    for (const chat of chats) {
      // Identify the other user's ID
      const receiverId = chat.userIDs.find(id => id !== tokenUserId);

      // Fetch the other user's details
      const receiver = await prisma.user.findUnique({
        where: {
          id: receiverId,
        },
        // Select only relevant fields
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      });
      // Attach the other user's details to the chat object
      chat.receiver = receiver;
    }

    // Respond with the list of chats
    return res.status(200).json(chats);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get chats!' });
  }
};

// Get a specific chat by ID
export const getChat = async (req, res) => {
  const tokenUserId = req.userId;

  // Fetch the chat with messages if the user is a participant
  try {
    // Find the chat by ID and ensure the user is a participant
    const chat = await prisma.chat.findFirst({
      where: {
        id: req.params.id,
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
      // Include messages ordered by creation date
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!chat) return res.status(404).json({ message: 'Chat not found!' });

    const seenBy = Array.from(new Set([...(chat.seenBy || []), tokenUserId]));

    // Mark the chat as seen by the user
    await prisma.chat.update({
      where: {
        id: req.params.id,
      },
      // Add the user ID to the seenBy array
      data: {
        seenBy: {
          set: seenBy,
        },
      },
    });
    return res.status(200).json({
      ...chat,
      seenBy,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get chat!' });
  }
};

// Create a new chat between the authenticated user and another user
export const addChat = async (req, res) => {
  const tokenUserId = req.userId;
  const receiverId = req.body.receiverId;

  if (!receiverId) {
    return res.status(400).json({ message: 'receiverId is required' });
  }

  if (receiverId === tokenUserId) {
    return res.status(400).json({ message: 'Cannot start a chat with yourself' });
  }

  try {
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });

    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const existingChat = await prisma.chat.findFirst({
      where: {
        userIDs: {
          hasEvery: [tokenUserId, receiverId],
        },
      },
    });

    if (existingChat) {
      return res.status(200).json(existingChat);
    }

    const newChat = await prisma.chat.create({
      data: {
        userIDs: [tokenUserId, receiverId],
        seenBy: [tokenUserId],
      },
    });
    res.status(200).json(newChat);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add chat!' });
  }
};

// Mark a chat as read by the authenticated user
export const readChat = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const existingChat = await prisma.chat.findFirst({
      where: {
        id: req.params.id,
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
    });

    if (!existingChat) return res.status(404).json({ message: 'Chat not found!' });

    const chat = await prisma.chat.update({
      where: {
        id: req.params.id,
      },
      data: {
        seenBy: {
          set: Array.from(new Set([...(existingChat.seenBy || []), tokenUserId])),
        },
      },
    });
    res.status(200).json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Failed to read chat!' });
  }
};
