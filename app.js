import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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
