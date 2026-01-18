import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const token = req.cookies.token;

  // Check if token is provided
  if (!token) {
    return res.status(401).json({ message: 'Access Denied. No token provided.' });
  }

  // Verify token
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) {
    return res
      .status(500)
      .json({ message: 'Server misconfiguration: JWT_SECRET_KEY is not defined.' });
  }

  jwt.verify(token, secret, (err, payload) => {
    if (err) return res.status(401).json({ message: 'Invalid token.' });

    if (!payload || typeof payload !== 'object' || !payload.id) {
      return res.status(401).json({ message: 'Invalid token payload: missing user id.' });
    }

    req.userId = payload.id;
    next();
  });
};
