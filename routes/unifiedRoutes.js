import express from 'express';
import { processUserInput } from '../controllers/unifiedController.js';

const router = express.Router();

/**
 * POST /api/process
 * Unified endpoint that handles chat, image, audio, and PDF based on keywords
 * Body: {
 *   text: string (user input),
 *   messages?: array (chat history),
 *   action?: string (optional override: 'chat', 'image', 'audio', 'pdf')
 * }
 * Files: {
 *   pdf?: file (optional PDF file for processing)
 * }
 */
router.post('/process', processUserInput);

export default router;
