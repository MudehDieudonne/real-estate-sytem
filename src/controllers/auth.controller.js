import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const OTP_EXPIRY_MINUTES = 10;
const OTP_LENGTH = 6;

const getClientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

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

const signSessionToken = user =>
  jwt.sign(
    {
      id: user.id,
      role: user.role,
      isApproved: user.isApproved,
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: '7d' }
  );

const hashOtp = otp => crypto.createHash('sha256').update(String(otp)).digest('hex');

const generateOtp = () =>
  Array.from({ length: OTP_LENGTH }, () => Math.floor(Math.random() * 10)).join('');

const sanitizeUsername = value =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 24);

const createUniqueUsername = async baseUsername => {
  const base = baseUsername || 'user';
  let candidate = base;
  let counter = 0;

  while (counter < 50) {
    const existing = await prisma.user.findUnique({ where: { username: candidate } });
    if (!existing) return candidate;
    counter += 1;
    candidate = `${base}_${counter}`;
  }

  return `${base}_${Date.now()}`;
};

const sendVerificationEmail = async (email, otp, username) => {
  const webhookUrl = process.env.OTP_EMAIL_WEBHOOK_URL;
  const webhookToken = process.env.OTP_EMAIL_WEBHOOK_TOKEN;

  if (!webhookUrl) {
    // Fallback for development where email provider webhook is not configured.
    // eslint-disable-next-line no-console
    console.log(`[OTP FALLBACK] Verification code for ${email} (${username}): ${otp}`);
    return;
  }

  const response = await globalThis.fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(webhookToken ? { Authorization: `Bearer ${webhookToken}` } : {}),
    },
    body: JSON.stringify({
      to: email,
      subject: 'Your IRED verification code',
      text: `Hello ${username}, your OTP code is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
      html: `<p>Hello ${username},</p><p>Your OTP code is <strong>${otp}</strong>.</p><p>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send OTP mail via webhook.');
  }
};

const saveOtpForUser = async userId => {
  const otp = generateOtp();
  const codeHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.emailVerificationCode.deleteMany({ where: { userId } });
  await prisma.emailVerificationCode.create({
    data: {
      userId,
      codeHash,
      expiresAt,
    },
  });

  return otp;
};

const oauthConfigs = {
  facebook: {
    authUrl: 'https://www.facebook.com/v20.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v20.0/oauth/access_token',
    userUrl: 'https://graph.facebook.com/me?fields=id,name,email,picture',
    scopes: ['email', 'public_profile'],
    clientIdEnv: 'FACEBOOK_CLIENT_ID',
    clientSecretEnv: 'FACEBOOK_CLIENT_SECRET',
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userUrl: 'https://api.linkedin.com/v2/userinfo',
    scopes: ['openid', 'profile', 'email'],
    clientIdEnv: 'LINKEDIN_CLIENT_ID',
    clientSecretEnv: 'LINKEDIN_CLIENT_SECRET',
  },
};

const getOAuthConfig = provider => oauthConfigs[provider] || null;

const buildOAuthRedirectUri = provider => {
  const apiBase = process.env.API_BASE_URL || 'http://localhost:3030';
  return `${apiBase}/api/auth/oauth/${provider}/callback`;
};

const parseOAuthProfile = (provider, profile) => {
  if (provider === 'facebook') {
    return {
      email: profile.email,
      name: profile.name || 'Facebook User',
      avatar: profile.picture?.data?.url,
      providerAccountId: profile.id,
    };
  }

  if (provider === 'linkedin') {
    return {
      email: profile.email,
      name: profile.name || profile.given_name || 'LinkedIn User',
      avatar: profile.picture,
      providerAccountId: profile.sub,
    };
  }

  return null;
};

// register controller
export const register = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        emailVerified: false,
        authProvider: 'local',
      },
    });

    const otp = await saveOtpForUser(newUser.id);
    await sendVerificationEmail(newUser.email, otp, newUser.username);

    return res.status(201).json({
      message: 'User registered. Verification OTP has been sent to your email.',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        emailVerified: newUser.emailVerified,
      },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      return res.status(409).json({
        message: `User with this ${target ? target : 'username or email'} already exists!`,
      });
    }

    return res.status(500).json({ message: 'Internal server error: Failed to create user' });
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
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found!' });
    if (!user.password) {
      return res.status(400).json({
        message: 'This account uses social login. Please sign in with your provider.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid Password!' });

    if (!user.emailVerified) {
      return res.status(403).json({
        message: 'Email not verified. Please verify OTP sent to your email.',
        needsVerification: true,
        email: user.email,
      });
    }

    const token = signSessionToken(user);
    const userInfo = { ...user };
    delete userInfo.password;

    return res.cookie('token', token, getCookieOptions(req)).status(200).json(userInfo);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to login!' });
  }
};

export const verifyEmailOtp = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ message: 'Email and OTP code are required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found!' });

    const latestCode = await prisma.emailVerificationCode.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestCode) {
      return res.status(400).json({ message: 'No OTP request found. Please request a new code.' });
    }

    if (latestCode.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP code expired. Please request a new code.' });
    }

    const isValid = latestCode.codeHash === hashOtp(code);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid OTP code.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    await prisma.emailVerificationCode.deleteMany({ where: { userId: user.id } });

    const token = signSessionToken(user);
    return res
      .cookie('token', token, getCookieOptions(req))
      .status(200)
      .json({
        message: 'Email verified successfully.',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          emailVerified: true,
        },
      });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to verify OTP.' });
  }
};

export const resendEmailOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found!' });

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified.' });
    }

    const otp = await saveOtpForUser(user.id);
    await sendVerificationEmail(user.email, otp, user.username);

    return res.status(200).json({ message: 'A new OTP has been sent to your email.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to resend OTP.' });
  }
};

export const oauthStart = async (req, res) => {
  const provider = req.params.provider;
  const config = getOAuthConfig(provider);
  if (!config) return res.status(400).json({ message: 'Unsupported social provider.' });

  const clientId = process.env[config.clientIdEnv];
  if (!clientId) {
    return res.status(500).json({ message: `${config.clientIdEnv} is not configured.` });
  }

  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = buildOAuthRedirectUri(provider);

  const params = new globalThis.URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
  });

  res.cookie('oauth_state', state, {
    ...getCookieOptions(req),
    maxAge: 1000 * 60 * 10,
  });

  return res.redirect(`${config.authUrl}?${params.toString()}`);
};

export const oauthCallback = async (req, res) => {
  const provider = req.params.provider;
  const config = getOAuthConfig(provider);
  if (!config) return res.status(400).json({ message: 'Unsupported social provider.' });

  const { code, state } = req.query;
  if (!code || !state || state !== req.cookies.oauth_state) {
    return res.redirect(`${getClientUrl()}/login?socialError=invalid_state`);
  }

  const clientId = process.env[config.clientIdEnv];
  const clientSecret = process.env[config.clientSecretEnv];
  const redirectUri = buildOAuthRedirectUri(provider);

  if (!clientId || !clientSecret) {
    return res.redirect(`${getClientUrl()}/login?socialError=missing_credentials`);
  }

  try {
    const tokenBody = new globalThis.URLSearchParams({
      code: String(code),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const tokenResponse = await globalThis.fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenBody,
    });

    if (!tokenResponse.ok) {
      return res.redirect(`${getClientUrl()}/login?socialError=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return res.redirect(`${getClientUrl()}/login?socialError=no_access_token`);
    }

    const profileResponse = await globalThis.fetch(config.userUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      return res.redirect(`${getClientUrl()}/login?socialError=userinfo_failed`);
    }

    const profile = await profileResponse.json();
    const mapped = parseOAuthProfile(provider, profile);

    if (!mapped || !mapped.email) {
      return res.redirect(`${getClientUrl()}/login?socialError=no_email`);
    }

    const normalizedBase = sanitizeUsername((mapped.name || mapped.email.split('@')[0]).trim());

    const existingByEmail = await prisma.user.findUnique({ where: { email: mapped.email } });

    let user;
    if (existingByEmail) {
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          authProvider: provider,
          providerAccountId: mapped.providerAccountId,
          emailVerified: true,
          avatar: mapped.avatar || existingByEmail.avatar,
        },
      });
    } else {
      const username = await createUniqueUsername(normalizedBase);
      user = await prisma.user.create({
        data: {
          email: mapped.email,
          username,
          password: null,
          avatar: mapped.avatar,
          emailVerified: true,
          authProvider: provider,
          providerAccountId: mapped.providerAccountId,
        },
      });
    }

    const token = signSessionToken(user);

    return res
      .clearCookie('oauth_state', getCookieOptions(req))
      .cookie('token', token, getCookieOptions(req))
      .redirect(`${getClientUrl()}/feed`);
  } catch (err) {
    return res.redirect(`${getClientUrl()}/login?socialError=unexpected_error`);
  }
};

// logout controller
export const logout = (req, res) => {
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
        emailVerified: true,
        authProvider: true,
        role: true,
        isApproved: true,
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found!' });
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch current user.' });
  }
};
