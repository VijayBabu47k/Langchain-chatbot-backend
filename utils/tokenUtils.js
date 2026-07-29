import { config } from '../config/config.js';

/**
 * Estimate the number of tokens in a text string
 * Uses a rough approximation: 1 token ≈ 4 characters
 */
export function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate total tokens in an array of messages
 */
export function calculateContextTokens(messages) {
  let total = 0;
  messages.forEach(msg => {
    if (typeof msg.content === 'string') {
      total += estimateTokens(msg.content);
    }
  });
  return total;
}

/**
 * Prune messages to fit within MAX_CONTEXT_TOKENS
 * Keeps the first message and removes older messages if needed
 */
export function pruneMessages(messages) {
  if (messages.length <= 1) return messages;

  let contextTokens = calculateContextTokens(messages);
  const prunedMessages = [messages[0]];

  // If already under limit, return as is
  if (contextTokens <= config.MAX_CONTEXT_TOKENS) {
    return messages;
  }

  // Remove older messages from the back until we're under the limit
  for (let i = messages.length - 1; i > 0; i--) {
    if (contextTokens <= config.MAX_CONTEXT_TOKENS) break;
    if (messages[i].role === 'user' || messages[i].role === 'assistant') {
      const msgTokens = estimateTokens(messages[i].content);
      contextTokens -= msgTokens;
    }
  }

  // Add messages from the front
  for (let i = 1; i < messages.length; i++) {
    const currentTokens = calculateContextTokens(prunedMessages);
    const msgTokens = estimateTokens(messages[i].content);
    if (currentTokens + msgTokens <= config.MAX_CONTEXT_TOKENS) {
      prunedMessages.push(messages[i]);
    }
  }

  return prunedMessages;
}
