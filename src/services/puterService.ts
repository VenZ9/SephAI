import { ChatMessage, PuterUser, ModelOption, POPULAR_MODELS } from '../types/chat';

// Define the global window.puter interface
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
        signIn: () => Promise<any>;
        signOut: () => Promise<void>;
      };
      ui?: {
        authenticateWithPuter?: () => Promise<any>;
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
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return typeof window !== 'undefined' && !!window.puter && !!window.puter.ai;
}

/**
 * Checks if the user is currently signed into Puter.
 */
export function isPuterSignedIn(): boolean {
  if (typeof window === 'undefined' || !window.puter?.auth?.isSignedIn) {
    return false;
  }
  try {
    return window.puter.auth.isSignedIn();
  } catch (err) {
    console.warn('Error checking Puter auth status:', err);
    return false;
  }
}

/**
 * Gets currently logged in user info.
 */
export async function getPuterUser(): Promise<PuterUser | null> {
  if (typeof window === 'undefined' || !window.puter?.auth) return null;
  try {
    if (!window.puter.auth.isSignedIn()) return null;
    const user = await window.puter.auth.getUser();
    return user;
  } catch (err) {
    console.warn('Failed to get Puter user:', err);
    return null;
  }
}

/**
 * Triggers Puter sign-in flow.
 */
export async function signInPuter(): Promise<PuterUser | null> {
  if (typeof window === 'undefined' || !window.puter?.auth) {
    throw new Error('Puter SDK is not loaded. Please verify your connection.');
  }
  await window.puter.auth.signIn();
  return await getPuterUser();
}

/**
 * Signs the user out of Puter.
 */
export async function signOutPuter(): Promise<void> {
  if (typeof window === 'undefined' || !window.puter?.auth) return;
  await window.puter.auth.signOut();
}

/**
 * Fetches available models from Puter.ai if available, with built-in fallback.
 */
export async function fetchAvailableModels(): Promise<ModelOption[]> {
  try {
    const ready = await waitForPuter(2000);
    if (ready && window.puter?.ai?.listModels) {
      const models = await window.puter.ai.listModels();
      if (Array.isArray(models) && models.length > 0) {
        // Map raw model identifiers into ModelOptions
        const fetchedList: ModelOption[] = models.slice(0, 30).map((m: any) => {
          const id = typeof m === 'string' ? m : m.id || m.name || String(m);
          const name = typeof m === 'object' && m.name ? m.name : id;
          const provider = typeof m === 'object' && m.provider ? m.provider : 'Puter AI';
          return {
            id,
            name,
            description: typeof m === 'object' && m.description ? m.description : `AI model powered by ${provider}`,
            provider,
            isPopular: POPULAR_MODELS.some(pm => pm.id === id)
          };
        });

        // Ensure popular models remain easily accessible at the top
        const mergedMap = new Map<string, ModelOption>();
        POPULAR_MODELS.forEach(m => mergedMap.set(m.id, m));
        fetchedList.forEach(m => {
          if (!mergedMap.has(m.id)) {
            mergedMap.set(m.id, m);
          }
        });
        return Array.from(mergedMap.values());
      }
    }
  } catch (err) {
    console.warn('Using default popular models list due to error fetching from Puter:', err);
  }
  return POPULAR_MODELS;
}

/**
 * Streams chat response from Puter AI.
 */
export async function streamChatResponse(
  messages: ChatMessage[],
  systemPrompt: string,
  model: string,
  temperature: number,
  signal: AbortSignal,
  onChunk: (chunk: string) => void
): Promise<string> {
  const ready = await waitForPuter();
  if (!ready || !window.puter?.ai?.chat) {
    throw new Error('Puter AI SDK could not be initialized. Please check your network connection.');
  }

  // Format messages for the Puter chat API
  const formattedMessages: Array<{ role: string; content: string }> = [];

  if (systemPrompt && systemPrompt.trim()) {
    formattedMessages.push({
      role: 'system',
      content: systemPrompt.trim()
    });
  }

  // Filter valid user and assistant messages
  for (const msg of messages) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      formattedMessages.push({
        role: msg.role,
        content: msg.content
      });
    }
  }

  if (formattedMessages.length === 0) {
    throw new Error('Cannot send empty conversation.');
  }

  try {
    const response = await window.puter.ai.chat(formattedMessages, {
      model,
      stream: true,
      temperature,
      signal
    });

    let fullText = '';

    // Check if the response is an async iterable stream
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
      // In case the model returned a non-streaming string or object
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

    // Honest handling of Puter error codes and states
    const rawError = err?.message || String(err);
    console.error('Puter AI error:', err);

    if (rawError.includes('401') || rawError.toLowerCase().includes('unauthorized') || rawError.toLowerCase().includes('sign in')) {
      throw new Error('Sign-in required: This model requires a Puter account. Please click the Profile or Settings button to sign in.');
    } else if (rawError.includes('429') || rawError.toLowerCase().includes('rate limit') || rawError.toLowerCase().includes('quota')) {
      throw new Error('Usage quota or rate limit exceeded for this model. You can sign in to your Puter account for higher quotas, or try another model.');
    } else if (rawError.toLowerCase().includes('model not found') || rawError.toLowerCase().includes('unsupported model')) {
      throw new Error(`The model "${model}" is temporarily unavailable or unsupported on your tier. Please select another model.`);
    } else {
      throw new Error(rawError || 'An unexpected error occurred while communicating with Puter AI.');
    }
  }
}
