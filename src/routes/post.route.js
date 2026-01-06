import express from 'express';

const router = express.Router();

// Sample route for posts
router.get('/test', (req, res) => {
  res.json('Post route is working');
});

export default router;
