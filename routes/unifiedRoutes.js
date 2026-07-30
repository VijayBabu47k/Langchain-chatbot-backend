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

// Debug endpoint to test file uploads
router.post('/test-upload', (req, res) => {
  console.log('\n🧪 TEST UPLOAD REQUEST');
  console.log('📊 Body:', req.body);
  console.log('📁 Files:', req.files ? Object.keys(req.files) : 'none');
  console.log('📎 PDF File:', req.files?.pdf ? { name: req.files.pdf.name, size: req.files.pdf.size, mimetype: req.files.pdf.mimetype } : 'undefined');

  if (req.files?.pdf) {
    res.json({ success: true, file: { name: req.files.pdf.name, size: req.files.pdf.size } });
  } else {
    res.json({ success: false, error: 'No PDF file received', filesReceived: req.files ? Object.keys(req.files) : [] });
  }
});

export default router;
