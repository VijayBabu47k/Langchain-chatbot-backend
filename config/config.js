import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // API Keys and URLs
  DEEPINFRA_API_KEY: process.env.DEEPINFRA_API_KEY,
  DEEPINFRA_API_URL: 'https://api.deepinfra.com/v1/openai/chat/completions',
  
  // Model Configuration
  CHAT_MODEL_NAME: process.env.CHAT_MODEL_NAME || 'meta-llama/Llama-2-70b-chat-hf',
  IMAGE_MODEL_NAME: process.env.IMAGE_MODEL_NAME || 'black-forest-labs/FLUX-2-klein-9b',
  
  // Context and Token Limits
  MAX_CONTEXT_TOKENS: 1000,
  MAX_TOKENS_PER_MESSAGE: 200,

  // CORS Configuration
  CORS_ORIGIN: '*'
};
