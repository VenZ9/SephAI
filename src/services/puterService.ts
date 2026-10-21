import { ChatMessage, PuterUser, ModelOption, POPULAR_MODELS } from '../types/chat';
import { normalizeMessagesForPuter, validateMessagesForInvocation } from './messageNormalizer';

// Custom Error classes for clean error handling
export class PuterAuthError extends Error {
  code: string;
  constructor(message: string, code = 'auth_required') {
    super(message);
    this.name = 'PuterAuthError';
    this.code = code;
  }
}

export class PuterModelError extends Error {
  model: string;
  constructor(message: string, model: string) {
    super(message);
    this.name = 'PuterModelError';
    this.model = model;
  }
}

export class PuterQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PuterQuotaError';
  }
}

// Known unavailable / legacy models mapping to friendly warnings
const UNAVAILABLE_MODELS = new Set([
  'claude-3-5-sonnet',
  'claude-3.5-sonnet',
  'claude-3-7-sonnet',
  'claude-3.7-sonnet',
  'deepseek-chat',
  'deepseek-reasoner',
  'mistral-large-latest',
]);

// Declare the global window.puter interface
declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (
          promptOrMessages: string | Array<{ role: string; content: string }>,
          options?: {
            model?: string;
            stream?: boolean;
            temperature?: number;
            max_tokens?: number;
            signal?: AbortSignal;
            testMode?: boolean;
          }
        ) => Promise<any>;
        listModels?: (provider?: string) => Promise<any[]>;
      };
      auth: {
        isSignedIn: () => boolean;
        getUser: () => Promise<PuterUser>;
        signIn: (options?: any) => Promise<any>;
        signOut: () => Promise<void>;
      };
      authToken?: string | null;
      resetAuthToken?: () => void;
      ui?: {
        authenticateWithPuter?: (options?: any) => Promise<any>;
      };
    };
  }
}

/**
 * Checks if Puter SDK has finished loading on the page.
 */
export async function waitForPuter(timeoutMs = 5000): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if (typeof window !== 'undefined' && window.puter && window.puter.ai) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  return typeof window !== 'undefined' && !!window.puter && !!window.puter.ai;
}

/**
 * Explicitly checks if the user is currently signed into Puter.
 */
export function isPuterSignedIn(): boolean {
  if (typeof window === 'undefined' || !window.puter?.auth) {
    return false;
  }
  try {
    if (typeof window.puter.auth.isSignedIn === 'function') {
      return window.puter.auth.isSignedIn();
    }
    return !!window.puter.authToken;
  } catch (err) {
    console.warn('Error checking Puter auth status:', err);
    return false;
  }
}

/**
 * Retrieves the currently authenticated Puter user profile.
 * Does not throw if not signed in; returns null instead.
 */
export async function getPuterUser(): Promise<PuterUser | null> {
  if (typeof window === 'undefined' || !window.puter?.auth) return null;
  try {
    if (!isPuterSignedIn()) return null;
    const user = await window.puter.auth.getUser();
    if (user && user.username) {
      return user;
    }
    return null;
  } catch (err: any) {
    // If 401 / unauthorized, session may have expired
    if (err?.status === 401 || err?.code === 'token_missing' || err?.code === 'token_auth_failed') {
      return null;
    }
    console.warn('Failed to get Puter user:', err);
    return null;
  }
}

/**
 * Triggers an explicit Puter sign-in flow.
 * Must be called from a user-initiated interaction.
 */
export async function signInPuter(): Promise<PuterUser | null> {
  const ready = await waitForPuter();
  if (!ready || !window.puter?.auth?.signIn) {
    throw new Error('Puter SDK is still initializing. Please check your internet connection and try again.');
  }

  try {
    await window.puter.auth.signIn({ request_auth: true });
  } catch (err: any) {
    const code = err?.error || err?.code || '';
    if (code === 'auth_window_closed' || code === 'auth_canceled') {
      throw new PuterAuthError('Sign-in cancelled. Please sign in to continue chatting.', 'auth_canceled');
    }
    if (code === 'popup_blocked') {
      throw new PuterAuthError('The sign-in popup was blocked by your browser. Please allow popups for this site.', 'popup_blocked');
    }
    throw new PuterAuthError(err?.message || err?.msg || 'Sign-in could not be completed.', 'auth_failed');
  }

  // Verify that auth actually succeeded
  const user = await getPuterUser();
  if (!user && !isPuterSignedIn()) {
    throw new PuterAuthError('Sign-in was not completed. Please try signing in again.', 'auth_unverified');
  }

  return user;
}

/**
 * Signs the user out of Puter and clears session state.
 */
export async function signOutPuter(): Promise<void> {
  if (typeof window === 'undefined' || !window.puter?.auth) return;
  try {
    if (typeof window.puter.auth.signOut === 'function') {
      await window.puter.auth.signOut();
    }
    if (typeof window.puter.resetAuthToken === 'function') {
      window.puter.resetAuthToken();
    }
  } catch (err) {
    console.warn('Error during Puter signOut:', err);
  }
}

/**
 * Fetches available models from Puter.ai registry, merging with verified popular models.
 */
export async function fetchAvailableModels(): Promise<ModelOption[]> {
  try {
    const ready = await waitForPuter(2500);
    if (ready && window.puter?.ai?.listModels) {
      const models = await window.puter.ai.listModels();
      if (Array.isArray(models) && models.length > 0) {
        // Collect model IDs
        const fetchedList: ModelOption[] = [];
        const seen = new Set<string>();

        // 1. Put verified popular models first
        for (const pm of POPULAR_MODELS) {
          fetchedList.push(pm);
          seen.add(pm.id);
        }

        // 2. Add other models from Puter that are clean IDs
        for (const m of models) {
          const id = typeof m === 'string' ? m : m.id || m.name || String(m);
          if (!id || seen.has(id)) continue;

          // Exclude known retired/unsupported IDs
          if (UNAVAILABLE_MODELS.has(id.toLowerCase())) continue;

          // Only include simple or clean IDs (avoid long driver internals unless popular)
          const name = typeof m === 'object' && m.name ? m.name : id;
          const provider = typeof m === 'object' && m.provider ? m.provider : 'Puter AI';

          seen.add(id);
          fetchedList.push({
            id,
            name,
            description: typeof m === 'object' && m.description ? m.description : `AI model powered by ${provider}`,
            provider,
            isPopular: false
          });
        }

        return fetchedList;
      }
    }
  } catch (err) {
    console.warn('Using default popular models list due to error fetching from Puter:', err);
  }
  return POPULAR_MODELS;
}

/**
 * Validates whether the given model is available or supported.
 */
export function validateModelSupport(model: string, availableModels?: ModelOption[]): void {
  const normalized = (model || '').trim().toLowerCase();

  // Explicit check against known retired model IDs
  if (UNAVAILABLE_MODELS.has(normalized)) {
    let suggestion = 'Claude Sonnet 4.6 or GPT-4o';
    if (normalized.includes('claude')) suggestion = 'Claude Sonnet 4.6 (claude-sonnet-4-6)';
    if (normalized.includes('deepseek')) suggestion = 'DeepSeek V4.1 Flash (deepseek-flash)';
    if (normalized.includes('mistral')) suggestion = 'Mistral Small (mistral-small-2603)';

    throw new PuterModelError(
      `The model "${model}" is no longer available on Puter. Please switch to an active model such as ${suggestion} in the model selector.`,
      model
    );
  }

  // If availableModels list is provided, verify it exists or is in popular list
  if (availableModels && availableModels.length > 0) {
    const exists = availableModels.some(m => m.id.toLowerCase() === normalized);
    if (!exists && !POPULAR_MODELS.some(m => m.id.toLowerCase() === normalized)) {
      throw new PuterModelError(
        `The model "${model}" is not supported or recognized. Please select a valid model from the selector.`,
        model
      );
    }
  }
}

/**
 * Streams chat response from Puter AI.
 * 
 * Guarantees:
 * 1. Checks explicit authentication before sending to avoid unexpected redirects.
 * 2. Normalizes all messages to strictly valid { role, content } schemas.
 * 3. Validates model support.
 * 4. Honest error propagation (never fakes responses or silently substitutes models).
 */
export async function streamChatResponse(
  messages: ChatMessage[],
  systemPrompt: string,
  model: string,
  temperature: number,
  signal: AbortSignal,
  onChunk: (chunk: string) => void,
  availableModels?: ModelOption[]
): Promise<string> {
  const ready = await waitForPuter();
  if (!ready || !window.puter?.ai?.chat) {
    throw new Error('Puter AI SDK could not be initialized. Please check your network connection.');
  }

  // 1. Explicit Auth check: Do not let puter.ai.chat silently redirect mid-execution
  if (!isPuterSignedIn()) {
    throw new PuterAuthError(
      'Authentication required: Please sign in with your Puter account to chat with Seph AI.',
      'auth_required'
    );
  }

  // 2. Validate model availability
  validateModelSupport(model, availableModels);

  // 3. Normalize messages to exclude UI metadata, empty content, and error entries
  const normalizedMessages = normalizeMessagesForPuter(messages, systemPrompt);
  validateMessagesForInvocation(normalizedMessages);

  try {
    const response = await window.puter.ai.chat(normalizedMessages, {
      model,
      stream: true,
      temperature,
      signal
    });

    let fullText = '';

    // Consume streaming response
    if (response && typeof response[Symbol.asyncIterator] === 'function') {
      for await (const chunk of response) {
        if (signal.aborted) {
          throw new DOMException('Generation stopped by user.', 'AbortError');
        }

        const delta = chunk?.text ?? (typeof chunk === 'string' ? chunk : chunk?.content ?? '');
        if (delta) {
          fullText += delta;
          onChunk(fullText);
        }
      }
    } else if (response) {
      // Non-streaming fallback
      const text = typeof response === 'string'
        ? response
        : response?.message?.content || response?.text || JSON.stringify(response);
      fullText = text;
      onChunk(fullText);
    }

    if (!fullText.trim()) {
      throw new Error('Received an empty response from the AI model.');
    }

    return fullText;
  } catch (err: any) {
    if (signal.aborted || err.name === 'AbortError') {
      throw new DOMException('Generation stopped by user.', 'AbortError');
    }

    const rawError = err?.message || err?.msg || String(err);
    console.error('Puter AI invocation error:', err);

    // Normalize error codes
    const isAuthError =
      rawError.includes('401') ||
      rawError.includes('token_missing') ||
      rawError.includes('token_auth_failed') ||
      rawError.toLowerCase().includes('unauthorized') ||
      rawError.toLowerCase().includes('authentication') ||
      err?.code === 'token_missing' ||
      err?.code === 'token_auth_failed';

    const isQuotaError =
      rawError.includes('429') ||
      rawError.toLowerCase().includes('rate limit') ||
      rawError.toLowerCase().includes('quota') ||
      rawError.toLowerCase().includes('usage limit');

    const isModelError =
      rawError.toLowerCase().includes('model not found') ||
      rawError.toLowerCase().includes('unsupported model') ||
      rawError.toLowerCase().includes('model unavailable') ||
      rawError.toLowerCase().includes('unknown model') ||
      rawError.includes('404');

    if (isAuthError) {
      // Clear token to prevent expired session loop
      await signOutPuter();
      throw new PuterAuthError(
        'Your Puter session has expired or authentication is required. Please sign in to continue.',
        'session_expired'
      );
    } else if (isQuotaError) {
      throw new PuterQuotaError(
        'Usage quota or rate limit exceeded for this model on Puter. Please wait a moment, sign in with your Puter account, or try another model.'
      );
    } else if (isModelError) {
      throw new PuterModelError(
        `The model "${model}" is temporarily unavailable or unsupported on your tier. Please select another model.`,
        model
      );
    } else {
      throw new Error(rawError || 'An unexpected error occurred while communicating with Puter AI.');
    }
  }
}
