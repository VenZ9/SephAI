import { ChatMessage, MessageRole } from '../types/chat';

export interface NormalizedMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const VALID_ROLES = new Set<MessageRole>(['system', 'user', 'assistant']);

/**
 * Normalizes an array of ChatMessages into the exact format required by Puter.js
 * and underlying LLM providers (e.g. OpenAI, Anthropic, DeepSeek, Google).
 * 
 * Rules:
 * 1. Excludes UI-only metadata (id, timestamp, modelUsed, isStreaming, isError, errorMessage).
 * 2. Excludes messages with isError = true (failed generation attempts are not conversation context).
 * 3. Excludes messages with empty, whitespace-only, null, or undefined content.
 * 4. Normalizes role to 'system' | 'user' | 'assistant'.
 * 5. Prepends system prompt if provided and non-empty.
 * 6. Ensures the sequence contains valid non-empty string content.
 */
export function normalizeMessagesForPuter(
  messages: ChatMessage[],
  systemPrompt?: string
): NormalizedMessage[] {
  const normalized: NormalizedMessage[] = [];

  // 1. Add system prompt if valid
  if (typeof systemPrompt === 'string' && systemPrompt.trim().length > 0) {
    normalized.push({
      role: 'system',
      content: systemPrompt.trim()
    });
  }

  // 2. Process conversation messages
  if (Array.isArray(messages)) {
    for (const msg of messages) {
      if (!msg) continue;

      // Exclude messages flagged as errors
      if (msg.isError) continue;

      // Extract and validate content
      const rawContent = msg.content;
      if (typeof rawContent !== 'string') continue;

      const trimmedContent = rawContent.trim();
      // OpenAI and other providers reject empty content with:
      // "each message must have a 'content' property"
      if (trimmedContent.length === 0) continue;

      // Validate role
      const rawRole = (msg.role || '').toLowerCase() as MessageRole;
      const role = VALID_ROLES.has(rawRole) ? rawRole : 'user';

      // Push clean object strictly with role and content
      normalized.push({
        role,
        content: trimmedContent
      });
    }
  }

  return normalized;
}

/**
 * Verifies that the normalized messages array is ready for model invocation.
 * Must contain at least one user message.
 */
export function validateMessagesForInvocation(messages: NormalizedMessage[]): void {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Message history is empty. Please enter a message to send.');
  }

  const hasUserMessage = messages.some(m => m.role === 'user' && m.content.length > 0);
  if (!hasUserMessage) {
    throw new Error('No valid user message found to send.');
  }

  // Ensure each message has a valid non-empty string content
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (!m || typeof m.content !== 'string' || m.content.trim().length === 0) {
      throw new Error(`Invalid message at index ${i}: each message must have a non-empty 'content' string.`);
    }
  }
}
