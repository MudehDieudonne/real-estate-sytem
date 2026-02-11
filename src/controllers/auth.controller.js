import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const getCookieOptions = req => {
  const isProduction = process.env.NODE_ENV === 'production';
  const forwardedProto = req.headers['x-forwarded-proto'];
  const isHttps = req.secure || forwardedProto === 'https';

  return {
    httpOnly: true,
    secure: isProduction || isHttps,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: '/',
  };
};

// register controller
export const register = async (req, res) => {
  // decompose request body
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required.' });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user logic
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      return res
        .status(409)
        .json({
          message: `User with this ${target ? target : 'username or email'} already exists!`,
        });
    }
    res.status(500).json({
      message: 'Internal server error: Failed to create user',
    });
  }
};

// login controller
export const login = async (req, res) => {
  const { username, email, password } = req.body;
  const identifier = username || email;
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Username/email and password are required.' });
  }

  try {
    // CHECK IF THE USER EXISTS
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found!' });

    // CHECK IF THE PASSWORD IS CORRECT
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid Password!' });

    // GENERATE COOKIE TOKEN AND SEND TO THE CLIENT
    const token = jwt.sign(
      {
        id: user.id,
        isAdmin: false,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '7d' }
    );

    const { password: _, ...userInfo } = user;

    res.cookie('token', token, getCookieOptions(req)).status(200).json(userInfo);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Failed to login!' });
  }
};

// logout controller
export const logout = (req, res) => {
  // logout logic here
  res
    .clearCookie('token', getCookieOptions(req))
    .status(200)
    .json({ message: 'Logged out successfully' });
};

export const me = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const user = await prisma.user.findUnique({
      where: { id: tokenUserId },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found!' });
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch current user.' });
  }
};
