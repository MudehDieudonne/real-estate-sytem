import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';

// Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
    });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get users!', error: err });
  }
};

// Get a single user by ID
export const getUser = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to get user!',
      error: err,
    });
  }
};

// Update user details
export const updateUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;
  const { password, avatar, ...inputs } = req.body;

  if (id !== tokenUserId) {
    return res.status(403).json({ message: 'Not Authorized!' });
  }

  let updatedPassword = null;
  try {
    if (password) {
      updatedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      // Update user data
      data: {
        ...inputs,
        ...(updatedPassword && { password: updatedPassword }),
        ...(avatar && { avatar }),
      },
    });

    const { password: userPassword, ...rest } = updatedUser;

    res.status(200).json(rest);
    res.status(200).json(rest);
  } catch (err) {
    console.error('Error updating user:', err);
    if (err.code === 'P2002') {
      const target = err.meta?.target;
      return res.status(409).json({
        message: `A user with this ${target ? target : 'username or email'} already exists!`,
      });
    }
    res.status(500).json({ message: 'Failed to update user details!', error: err.message });
  }
};

// Delete a user
export const deleteUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  if (id !== tokenUserId) {
    return res.status(403).json({ message: 'Not Authorized!' });
  }

  try {
    await prisma.user.delete({
      where: { id },
    });
    res.status(200).json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete users!', error: err });
  }
};

// Save a post
export const savePost = async (req, res) => {
  const postId = req.body.postId;
  const tokenUserId = req.userId;

  try {
    // Verify the post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found!' });
    }

    const savedPost = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: tokenUserId,
          postId,
        },
      },
    });

    if (savedPost) {
      await prisma.savedPost.delete({
        where: {
          id: savedPost.id,
        },
      });
      res.status(200).json({ message: 'Post removed from saved list' });
    } else {
      await prisma.savedPost.create({
        data: {
          userId: tokenUserId,
          postId,
        },
      });
      res.status(200).json({ message: 'Post saved' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to save post!' });
  }
};

// Get profile posts (user's own posts and saved posts)
export const profilePosts = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const userPosts = await prisma.post.findMany({
      where: { userId: tokenUserId },
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
        postDetail: true,
      },
    });
    const saved = await prisma.savedPost.findMany({
      where: { userId: tokenUserId },
      include: {
        post: {
          include: {
            user: {
              select: {
                username: true,
                avatar: true,
              },
            },
            postDetail: true,
          },
        },
      },
    });

    const savedPosts = saved.map(item => ({ ...item.post, isSaved: true }));
    res.status(200).json({ userPosts, savedPosts });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Failed to get profile posts!' });
  }
};
