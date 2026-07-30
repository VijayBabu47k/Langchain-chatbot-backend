import axios from 'axios';
import { config } from '../config/config.js';

export const ACTION_TYPES = {
  CHAT: 'chat',
  IMAGE: 'image',
  AUDIO: 'audio',
  PDF: 'pdf'
};

// Fallback simple keywords for quick detection before AI analysis
const QUICK_KEYWORDS = {
  IMAGE: ['generate image', 'create image', 'draw', 'create picture', 'visualize', 'design', 'sketch'],
  AUDIO: ['read this', 'speak', 'audio', 'voice', 'text to speech'],
  PDF: ['pdf', 'document', 'summarize']
};

// Quick fallback detection - fast keyword check
function quickDetect(userInput, hasPdfFile = false) {
  if (!userInput) return ACTION_TYPES.CHAT;
  if (hasPdfFile) return ACTION_TYPES.PDF;

  const lowerInput = userInput.toLowerCase();

  for (const keyword of QUICK_KEYWORDS.IMAGE) {
    if (lowerInput.includes(keyword)) return ACTION_TYPES.IMAGE;
  }

  for (const keyword of QUICK_KEYWORDS.AUDIO) {
    if (lowerInput.includes(keyword)) return ACTION_TYPES.AUDIO;
  }

  for (const keyword of QUICK_KEYWORDS.PDF) {
    if (lowerInput.includes(keyword)) return ACTION_TYPES.PDF;
  }

  return ACTION_TYPES.CHAT;
}

// AI-powered intent detection - more intelligent
async function aiDetectAction(userInput, hasPdfFile = false) {
  if (!userInput) return ACTION_TYPES.CHAT;
  if (hasPdfFile) return ACTION_TYPES.PDF;

  try {
    console.log('🧠 Analyzing user intent with AI...');

    // Use DeepInfra to classify the intent
    const response = await axios.post(
      config.DEEPINFRA_API_URL,
      {
        model: config.CHAT_MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: `You are an intent classifier. Analyze the user input and classify it into ONE category:
- IMAGE: User wants to generate, create, or visualize images
- AUDIO: User wants audio generation, text-to-speech, or voice-related content
- PDF: User mentions PDF, documents, or has uploaded a file
- CHAT: Default - regular conversation or questions

Respond with ONLY the action type: IMAGE, AUDIO, PDF, or CHAT`
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${config.DEEPINFRA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data?.choices?.[0]?.message?.content?.trim().toUpperCase();

    console.log(`✅ AI detected action: ${aiResponse}`);

    // Parse AI response to determine action
    if (aiResponse) {
      if (aiResponse.includes('IMAGE')) return ACTION_TYPES.IMAGE;
      if (aiResponse.includes('AUDIO')) return ACTION_TYPES.AUDIO;
      if (aiResponse.includes('PDF')) return ACTION_TYPES.PDF;
      if (aiResponse.includes('CHAT')) return ACTION_TYPES.CHAT;
    }

    console.log('⚠️ AI response unclear, falling back to quick detect');
    return quickDetect(userInput, hasPdfFile);
  } catch (error) {
    console.warn('⚠️ AI detection failed, using quick detect:', error.message);
    return quickDetect(userInput, hasPdfFile);
  }
}

export async function detectAction(userInput, hasPdfFile = false) {
  // Always use AI for intelligent detection
  // Falls back to quick keywords if AI fails
  return await aiDetectAction(userInput, hasPdfFile);
}

// Simple function to extract image prompt
// Works with common image generation patterns
export function extractImagePrompt(userInput) {
  // Remove common image generation prefixes
  let prompt = userInput
    .replace(/^(generate|create|make|draw|show|visualize|design|sketch|illustrate|paint)\s+(image|picture|pic|artwork|art|visual)\s+of\s+/i, '')
    .replace(/^(generate|create|make|draw|show|visualize|design|sketch|illustrate|paint)\s+(image|picture|pic|artwork|art|visual)\s+/i, '')
    .trim();

  // If no replacement happened, return original input
  return prompt || userInput;
}
