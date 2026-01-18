import { prisma } from '../lib/prisma.js';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';

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
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
          },
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
    let isSaved = false;

    if (token) {
      try {
        const verifyToken = promisify(jwt.verify);
        const payload = await verifyToken(token, process.env.JWT_SECRET_KEY);

        const saved = await prisma.savedPost.findUnique({
          where: {
            userId_postId: {
              postId: id,
              userId: payload.id,
            },
          },
        });
        isSaved = !!saved;
      } catch (err) {
        // Token verification failed; isSaved remains false
        return res.status(401).json({ message: 'Invalid token.' });
      }
    }

    res.status(200).json({ ...post, isSaved });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get post', error: err });
  }
};

// create post
export const addPost = async (req, res) => {
  const { postDetail = {}, description, ...postData } = req.body;
  const tokenUserId = req.userId;

  try {
    const newPost = await prisma.post.create({
      data: {
        ...postData,
        userId: tokenUserId,
        postDetail: {
          create: {
            desc: postDetail.desc || req.body.description || '',
            utilities: postDetail.utilities,
            pet: postDetail.pet,
            income: postDetail.income,
            size: postDetail.size,
            school: postDetail.school,
            bus: postDetail.bus,
            restaurant: postDetail.restaurant,
          },
        },
      },
    });
    res.status(201).json(newPost);
  } catch (err) {
    console.error('Error creating post:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'A post with these unique details already exists.' });
    }
    res
      .status(500)
      .json({
        message: 'Failed to create post. Please check your inputs and try again.',
        error: err.message,
      });
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

    // Update the post and its detail
    const { postDetail = {}, description, ...postData } = req.body;

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...postData,
        ...(postDetail && {
          postDetail: {
            update: {
              desc: postDetail.desc || description,
              utilities: postDetail.utilities,
              pet: postDetail.pet,
              income: postDetail.income,
              size: postDetail.size,
              school: postDetail.school,
              bus: postDetail.bus,
              restaurant: postDetail.restaurant,
            },
          },
        }),
      },
    });

    res.status(200).json(updatedPost);
  } catch (err) {
    console.error('Error updating post:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'A post with these unique details already exists.' });
    }
    return res
      .status(500)
      .json({ message: 'Failed to update post. Please try again.', error: err.message });
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
