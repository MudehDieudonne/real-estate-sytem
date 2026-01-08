import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';

// Get all posts
export const getPosts = async (req, res) => {
  const query = req.query;

  try {
    const posts = await prisma.post.findMany({
      where: {
        city: query.city || undefined,
        type: query.type || undefined,
        property: query.property || undefined,
        bedroom: parseInt(query.bedroom) || undefined,
        price: {
          gte: parseInt(query.minPrice) || undefined,
          lte: parseInt(query.maxPrice) || undefined,
        },
      },
    });

    // setTimeout(() => {
    res.status(200).json(posts);
    // }, 3000);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get posts', error: err });
  }
};

// get single post
export const getPost = async (req, res) => {
  const id = req.params.id;
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        postDetail: true,
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const token = req.cookies?.token;

    if (token) {
      jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
        if (!err) {
          const saved = await prisma.savedPost.findUnique({
            where: {
              userId_postId: {
                postId: id,
                userId: payload.id,
              },
            },
          });
          res.status(200).json({ ...post, isSaved: saved ? true : false });
        }
      });
    }
    res.status(200).json({ ...post, isSaved: false });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get post', error: err });
  }
};

// create post
export const addPost = async (req, res) => {
  const body = req.body;
  const tokenUserId = req.userId;

  try {
    const newPost = await prisma.post.create({
      data: {
        ...body,
        userId: tokenUserId,
      },
    });
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ message: 'Error creating post', error: err });
  }
};

// update post
export const updatePost = async (req, res) => {
  const id = req.params.id;
  const body = req.body;
  const tokenUserId = req.userId;

  try {
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (existingPost.userId !== tokenUserId) {
      return res.status(403).json({ message: 'Not Authorized!' });
    }

    if (body.userId && body.userId !== tokenUserId) {
      return res.status(403).json({ message: 'Cannot change post ownership!' });
    }

    // Update the post
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...body,
      },
    });

    res.status(200).json(updatedPost);
  } catch (err) {
    return res.status(500).json({ message: 'Error updating post', error: err });
  }
};

// delete post
export const deletePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  try {
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (existingPost.userId !== tokenUserId) {
      return res.status(403).json({ message: 'Not Authorized!' });
    }

    await prisma.post.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting post', error: err });
  }
};
