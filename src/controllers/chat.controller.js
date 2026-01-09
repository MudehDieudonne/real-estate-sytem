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
    const chat = await prisma.chat.findUnique({
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

    // Mark the chat as seen by the user
    await prisma.chat.update({
      where: {
        id: req.params.id,
      },
      // Add the user ID to the seenBy array
      data: {
        seenBy: {
          push: [tokenUserId],
        },
      },
    });
    return res.status(200).json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get chat!' });
  }
};

// Create a new chat between the authenticated user and another user
export const addChat = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const newChat = await prisma.chat.create({
      data: {
        userIDs: [tokenUserId, req.body.receiverId],
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
    const chat = await prisma.chat.update({
      where: {
        id: req.params.id,
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
      data: {
        seenBy: {
          set: [tokenUserId],
        },
      },
    });
    res.status(200).json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Failed to read chat!' });
  }
};
