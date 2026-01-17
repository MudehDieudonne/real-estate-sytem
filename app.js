import express from 'express';
import postRoutes from './src/routes/post.route.js';
import userRoutes from './src/routes/user.route.js';
import authRoutes from './src/routes/auth.route.js';
import chatRoutes from './src/routes/chat.route.js';
import messageRoutes from './src/routes/message.route.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(
  cors({
    origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Loko Estate API',
      version: '1.0.0',
      description: 'API Documentation for Loko Estate Real Estate Application',
      contact: {
        name: 'Mudeh Dieudonne Mukum',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development Server',
      },
      {
        url: process.env.PRODUCTION_URL || 'https://api.lokostate.com',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT token stored in httpOnly cookie',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], // Files containing annotations
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// auth routes
app.use('/api/auth', authRoutes);

// user routes
app.use('/api/users', userRoutes);

// post routes
app.use('/api/posts', postRoutes);

// chat routes
app.use('/api/chats', chatRoutes);

// message routes
app.use('/api/messages', messageRoutes);

// Basic welcome route with API info and endpointscheck
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
