import axios from 'axios';
import { config } from '../config/config.js';

/**
 * Generate image from prompt using DeepInfra API
 */
export async function generateImage(req, res) {
  const { prompt, quality = 'hd', size = '1024x1024', n = 1 } = req.body;
  console.log('\n🎨 New image generation request received');

  // Validation
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (!config.DEEPINFRA_API_KEY) {
    return res.status(500).json({ error: 'DEEPINFRA_API_KEY not configured' });
  }

  try {
    console.log(`Generating image with prompt: "${prompt}"`);

    const response = await axios.post(
      'https://api.deepinfra.com/v1/openai/images/generations',
      {
        model: config.IMAGE_MODEL_NAME,
        prompt,
        quality,
        size,
        n,
        response_format: 'b64_json'
      },
      {
        headers: {
          'Authorization': `Bearer ${config.DEEPINFRA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const imageData = response.data?.data?.[0];
    if (imageData?.b64_json) {
      const imageUrl = `data:image/png;base64,${imageData.b64_json}`;
      console.log('✓ Image generated successfully');
      res.json({ imageUrl });
    } else if (imageData?.url) {
      console.log('✓ Image URL received');
      res.json({ imageUrl: imageData.url });
    } else {
      res.status(500).json({ error: 'Failed to generate image' });
    }
  } catch (error) {
    console.error('Image generation error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      config: error.config?.url
    });
    res.status(500).json({
      error: error.response?.data?.error?.message || error.message || 'Failed to generate image',
      details: config.NODE_ENV === 'development' ? error.response?.data : undefined
    });
  }
}

/**
 * Get health status of image service
 */
export function getImageHealth(req, res) {
  res.json({ 
    status: 'ok', 
    message: 'Image generation service is running',
    model: config.IMAGE_MODEL_NAME
  });
}
