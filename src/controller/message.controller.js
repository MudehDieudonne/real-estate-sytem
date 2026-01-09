import prisma from '../lib/prisma.js';

// Add a new message to a chat
export const addMessage = async (req, res) => {
  // Get the user ID from the token
  const tokenUserId = req.userId;
  const chatId = req.params.chatId;
  const text = req.body.text;

  // Verify that the chat exists and the user is a participant
  try {
    // Find the chat and verify the user is a participant
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
    });

    // Check if the chat exists
    if (!chat) return res.status(404).json({ message: 'Chat not found!' });

    // Create the new message
    const message = await prisma.message.create({
      data: {
        text,
        chatId,
        userId: tokenUserId,
      },
    });

    // Update the chat's lastMessage and seenBy fields
    await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        seenBy: [tokenUserId],
        lastMessage: text,
      },
    });

    res.status(200).json(message);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add message!' });
  }
};
