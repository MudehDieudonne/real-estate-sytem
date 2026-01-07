import express from 'express';
// import postRoutes from './src/routes/post.route.js';
import userRoutes from './src/routes/user.route.js';
import authRoutes from './src/routes/auth.route.js';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

// auth routes
app.use('/api/auth', authRoutes);

// user routes
app.use('/api/users', userRoutes);

// routes
// app.use('/api/posts', postRoutes);

// endpointscheck
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Real Estate API is running' });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Loko Estate API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
    },
  });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on port ${PORT}`);
});

export default app;
