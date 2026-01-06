import express from 'express';
import postRoutes from './src/routes/post.route.js';
import authRoutes from './src/routes/auth.route.js';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

// middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// routs
app.use('/api/posts', postRoutes);

// auth routes
app.use('/api/auth', authRoutes);

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
  console.log(`Server is running on port ${PORT}`);
});

export default app;
