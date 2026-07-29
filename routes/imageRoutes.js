import express from 'express';
import { generateImage, getImageHealth } from '../controllers/imageController.js';

const router = express.Router();

/**
 * POST /api/generate-image
 * Generate an image from a text prompt
 */
router.post('/generate-image', generateImage);

/**
 * GET /api/image-health
 * Image service health check
 */
router.get('/image-health', getImageHealth);

export default router;
