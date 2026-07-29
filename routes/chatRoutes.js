import express from 'express';
import { streamChat } from '../controllers/chatController.js';

const router = express.Router();

/**
 * POST /api/chat
 * Stream a chat response from the AI
 */
router.post('/chat', streamChat);

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

export default router;
