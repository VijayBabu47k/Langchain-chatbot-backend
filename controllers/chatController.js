import axios from 'axios';
import { config } from '../config/config.js';
import { calculateContextTokens, pruneMessages } from '../utils/tokenUtils.js';

/**
 * Stream chat response from DeepInfra API
 */
export async function streamChat(req, res) {
  const { messages } = req.body;
  console.log('\n📨 New chat request received', messages);

  // Validation
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  if (!config.DEEPINFRA_API_KEY) {
    return res.status(500).json({ error: 'DEEPINFRA_API_KEY not configured' });
  }

  try {
    // Prune messages to fit within token limit
    const contextTokens = calculateContextTokens(messages);
    const prunedMessages = contextTokens > config.MAX_CONTEXT_TOKENS
      ? pruneMessages(messages)
      : messages;

    console.log(`Context tokens: ${contextTokens}, Pruned messages: ${prunedMessages.length}`);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Request from DeepInfra API
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

    let totalChunks = 0;
    let sentChunks = 0;
    // console.log("response.data",response.data);

    // Process stream data
    response.data.on('data', (chunk) => {
      const chunkStr = chunk.toString();
      totalChunks++;

      const lines = chunkStr.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];


        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            res.write(line + '\n');
          } else if (data) {
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';

              if (content) {
                sentChunks++;
                res.write(line + '\n');
              } else {
                res.write(line + '\n');
              }
            } catch (e) {
              res.write(line + '\n');
            }
          }
        }
      }
    });


    response.data.on('end', () => {
      console.log(`\n✓ Stream ended. Total chunks: ${totalChunks}, Sent chunks: ${sentChunks}\n`);
      res.end();
    });

    response.data.on('error', (error) => {
      console.error('Stream error:', error);
      res.end();
    });

  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data?.error?.message || 'Failed to get response from AI',
    });
  }
}
