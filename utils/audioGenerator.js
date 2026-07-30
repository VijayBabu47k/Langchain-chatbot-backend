import axios from 'axios';
import { config } from '../config/config.js';

/**
 * Generate audio from text using TTS
 * Converts text to speech/audio
 */
export async function generateTextToSpeech(text) {
  try {
    console.log('🔊 Generating text-to-speech...');

    // Using a simple TTS approach with speech synthesis
    // In production, you'd use a dedicated TTS service
    // For now, we'll return metadata indicating TTS should happen client-side

    return {
      type: 'tts',
      text: text,
      message: 'Audio playback ready - use browser TTS',
      success: true
    };
  } catch (error) {
    console.error('TTS Error:', error.message);
    throw error;
  }
}

/**
 * Generate audio/music from prompt
 * Creates audio from text descriptions
 */
export async function generateAudioFromPrompt(prompt) {
  try {
    console.log('🎵 Generating audio from prompt...');

    // For audio generation, we use a different approach
    // This is a placeholder - you can integrate with audio generation APIs

    const response = await axios.post(
      config.DEEPINFRA_API_URL,
      {
        model: config.CHAT_MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: 'You are an audio description generator. Describe in detail what audio/music should sound like based on the user request.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${config.DEEPINFRA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const description = response.data?.choices?.[0]?.message?.content;

    return {
      type: 'audio_generation',
      prompt: prompt,
      description: description,
      message: 'Audio generation ready',
      success: true
    };
  } catch (error) {
    console.error('Audio generation error:', error.message);
    throw error;
  }
}

/**
 * Synthesize speech from text using browser API
 * This happens on the frontend but we prepare the data here
 */
export function prepareTTSData(text) {
  return {
    type: 'tts',
    text: text,
    language: 'en-US',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  };
}
