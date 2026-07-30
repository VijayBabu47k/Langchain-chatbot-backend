import axios from 'axios';
import fs from 'node:fs';
import { config } from '../config/config.js';
import { calculateContextTokens, pruneMessages } from '../utils/tokenUtils.js';
import { detectAction, extractImagePrompt, ACTION_TYPES } from '../utils/keywordDetector.js';
import { extractTextFromPdf, chunkPdfText } from '../utils/pdfProcessor.js';

export async function processUserInput(req, res) {
  let text = req.body.text;
  let messages = req.body.messages;
  const pdfFile = req.files?.pdf;

  console.log('\n📨 New unified request received');
  console.log('📊 Request body keys:', Object.keys(req.body));
  console.log('📊 Request body values:', { text: text?.substring?.(0, 50), messages: typeof messages });
  console.log('📁 Files attached:', req.files ? Object.keys(req.files) : 'none');
  console.log('📎 req.files object:', JSON.stringify(req.files, null, 2));
  console.log('📋 Content-Type:', req.get('content-type'));
  console.log('🔍 PDF File exists:', !!pdfFile, pdfFile ? `(${pdfFile.size} bytes)` : '');

  if (typeof messages === 'string') {
    try {
      messages = JSON.parse(messages);
    } catch {
      console.warn('⚠️ Failed to parse messages JSON, using empty array');
      messages = [];
    }
  }

  if (!text) {
    console.error('❌ Missing text input');
    console.error('📊 Received body:', req.body);
    return res.status(400).json({ error: 'Text input is required' });
  }

  if (!config.DEEPINFRA_API_KEY) {
    console.error('❌ DEEPINFRA_API_KEY not configured');
    return res.status(500).json({ error: 'DEEPINFRA_API_KEY not configured' });
  }

  try {
    const detectedAction = await detectAction(text, !!pdfFile);

    console.log(`🎯 Detected action: ${detectedAction}`);
    if (pdfFile) {
      console.log(`📄 PDF file size: ${pdfFile.size} bytes`);
    }

    if (detectedAction === ACTION_TYPES.IMAGE) {
      return await handleImageGeneration(text, res);
    }

    if (detectedAction === ACTION_TYPES.AUDIO) {
      return await handleAudioGeneration(text, res);
    }

    if (detectedAction === ACTION_TYPES.PDF && pdfFile) {
      return await handlePdfProcessing(pdfFile, text, messages, res);
    }

    return await handleChatStream(messages || [], text, res);

  } catch (error) {
    console.error('❌ Unified API Error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      error: error.response?.data?.error?.message || error.message || 'Failed to process request',
      details: config.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function handleChatStream(messages, userText, res) {
  console.log('💬 Processing as chat');

  const userMessages = messages || [];
  const newMessage = { role: 'user', content: userText };

  // Add system prompt to identify as QUANTOM
  const systemMessage = {
    role: 'system',
    content: `You are QUANTOM, Vijay's AI assistant. When asked who you are, say: "I'm QUANTOM, Vijay's AI assistant." Now respond helpfully to the user's message.`
  };

  const allMessages = [systemMessage, ...userMessages, newMessage];

  const contextTokens = calculateContextTokens(allMessages);
  const prunedMessages = contextTokens > config.MAX_CONTEXT_TOKENS
    ? pruneMessages(allMessages)
    : allMessages;

  console.log(`Context tokens: ${contextTokens}, Pruned messages: ${prunedMessages.length}`);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const response = await axios.post(
      config.DEEPINFRA_API_URL,
      {
        model: config.CHAT_MODEL_NAME,
        messages: prunedMessages,
        stream: true,
        max_tokens: config.MAX_TOKENS_PER_MESSAGE,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${config.DEEPINFRA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
      }
    );

    response.data.on('data', (chunk) => {
      const chunkStr = chunk.toString();
      const lines = chunkStr.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            res.write(line + '\n');
          } else if (data) {
            try {
              JSON.parse(data);
              res.write(line + '\n');
            } catch {
              res.write(line + '\n');
            }
          }
        }
      }
    });

    response.data.on('end', () => {
      console.log('✓ Chat stream ended\n');
      res.end();
    });

    response.data.on('error', (error) => {
      console.error('Stream error:', error);
      res.end();
    });

  } catch (error) {
    console.error('Chat API Error:', error.message);
    throw error;
  }
}

async function handleImageGeneration(userText, res) {
  console.log('🎨 Processing as image generation');

  const imagePrompt = extractImagePrompt(userText);

  try {
    const response = await axios.post(
      'https://api.deepinfra.com/v1/openai/images/generations',
      {
        model: config.IMAGE_MODEL_NAME,
        prompt: imagePrompt,
        quality: 'standard',
        size: '512x512',
        n: 1,
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
      console.log('✓ Image generated successfully\n');
      res.json({
        type: 'image',
        imageUrl,
        prompt: imagePrompt
      });
    } else if (imageData?.url) {
      console.log('✓ Image URL received\n');
      res.json({
        type: 'image',
        imageUrl: imageData.url,
        prompt: imagePrompt
      });
    } else {
      res.status(500).json({ error: 'Failed to generate image' });
    }
  } catch (error) {
    console.error('Image generation error:', error.message);
    throw error;
  }
}

async function handleAudioGeneration(userText, res) {
  console.log('🎵 Processing as audio generation');

  try {
    // Create a detailed description of the audio to generate
    const descriptionResponse = await axios.post(
      config.DEEPINFRA_API_URL,
      {
        model: config.CHAT_MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: 'You are QUANTOM, an audio generation assistant. Create a detailed description of the audio/music that should be generated based on the user request. Keep it to 1-2 sentences.'
          },
          {
            role: 'user',
            content: userText
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

    const description = descriptionResponse.data?.choices?.[0]?.message?.content;

    console.log('✓ Audio generation metadata created\n');
    res.setHeader('Content-Type', 'application/json');
    res.json({
      type: 'audio_generation',
      prompt: userText,
      description: description || 'Audio generated from your request',
      message: 'Audio generation ready',
      success: true
    });
  } catch (error) {
    console.error('Audio generation error:', error.message);
    throw error;
  }
}

async function handleAudioChat(messages, userText, res) {
  console.log('🔊 Processing as audio chat');

  const userMessages = messages || [];
  const newMessage = { role: 'user', content: userText };

  // Add system prompt to identify as QUANTOM
  const systemMessage = {
    role: 'system',
    content: `You are QUANTOM, Vijay's AI assistant. When asked who you are, say: "I'm QUANTOM, Vijay's AI assistant." Now respond helpfully to the user's message.`
  };

  const allMessages = [systemMessage, ...userMessages, newMessage];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const response = await axios.post(
      config.DEEPINFRA_API_URL,
      {
        model: config.CHAT_MODEL_NAME,
        messages: allMessages,
        stream: true,
        max_tokens: config.MAX_TOKENS_PER_MESSAGE,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${config.DEEPINFRA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
      }
    );

    response.data.on('data', (chunk) => {
      const chunkStr = chunk.toString();
      const lines = chunkStr.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          res.write(`data: ${JSON.stringify({ type: 'audio_chat' })}\n`);
          const data = line.slice(6).trim();
          if (data !== '[DONE]' && data) {
            try {
              JSON.parse(data);
              res.write(line + '\n');
            } catch {
              res.write(line + '\n');
            }
          }
        }
      }
    });

    response.data.on('end', () => {
      console.log('✓ Audio chat stream ended\n');
      res.end();
    });

    response.data.on('error', (error) => {
      console.error('Stream error:', error);
      res.end();
    });

  } catch (error) {
    console.error('Audio chat error:', error.message);
    throw error;
  }
}

async function handlePdfProcessing(pdfFile, userText, messages, res) {
  console.log('📄 Processing as PDF');

  try {
    // Read PDF from temp file or buffer
    let pdfBuffer;
    if (pdfFile.tempFilePath) {
      console.log(`📂 Reading PDF from temp file: ${pdfFile.tempFilePath}`);
      pdfBuffer = fs.readFileSync(pdfFile.tempFilePath);
    } else if (pdfFile.data) {
      console.log('📂 Reading PDF from buffer');
      pdfBuffer = pdfFile.data;
    } else {
      throw new Error('PDF file has no data or tempFilePath');
    }

    const pdfData = await extractTextFromPdf(pdfBuffer);
    const pdfSummary = chunkPdfText(pdfData.text, 1000)[0];

    console.log(`✓ PDF extracted: ${pdfData.numPages} pages, ${pdfData.text.length} characters`);

    const userMessages = messages || [];
    const pdfContext = `[PDF Content - ${pdfData.numPages} pages]: ${pdfSummary}`;
    const systemMessage = {
      role: 'system',
      content: `CRITICAL INSTRUCTION: Your name is QUANTOM. You are Vijay's AI assistant. You are NOT Claude, you are NOT ChatGPT, you are NOT any other AI. Your ONLY name is QUANTOM.

You are analyzing a PDF for Vijay. Here is the document content:
${pdfContext}

User Query: ${userText}

Provide helpful and intelligent analysis. Remember: You are QUANTOM, Vijay's AI assistant. Always identify yourself as QUANTOM.`
    };

    const allMessages = [systemMessage, ...userMessages];

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const response = await axios.post(
      config.DEEPINFRA_API_URL,
      {
        model: config.CHAT_MODEL_NAME,
        messages: allMessages,
        stream: true,
        max_tokens: config.MAX_TOKENS_PER_MESSAGE,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${config.DEEPINFRA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
      }
    );

    response.data.on('data', (chunk) => {
      const chunkStr = chunk.toString();
      const lines = chunkStr.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data !== '[DONE]' && data) {
            try {
              JSON.parse(data);
              res.write(line + '\n');
            } catch {
              res.write(line + '\n');
            }
          }
        }
      }
    });

    response.data.on('end', () => {
      console.log('✓ PDF analysis stream ended\n');
      // Clean up temp file
      if (pdfFile.tempFilePath) {
        fs.unlink(pdfFile.tempFilePath, (err) => {
          if (err) console.warn('Failed to delete temp file:', err.message);
        });
      }
      res.end();
    });

    response.data.on('error', (error) => {
      console.error('Stream error:', error);
      // Clean up temp file on error
      if (pdfFile.tempFilePath) {
        fs.unlink(pdfFile.tempFilePath, (err) => {
          if (err) console.warn('Failed to delete temp file:', err.message);
        });
      }
      res.end();
    });

  } catch (error) {
    console.error('PDF processing error:', error.message);
    // Clean up temp file on error
    if (pdfFile.tempFilePath) {
      fs.unlink(pdfFile.tempFilePath, (err) => {
        if (err) console.warn('Failed to delete temp file:', err.message);
      });
    }
    throw error;
  }
}
