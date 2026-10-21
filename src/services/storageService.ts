import { Conversation, AppSettings, DEFAULT_SETTINGS, PendingAuthAction } from '../types/chat';

const STORAGE_KEYS = {
  CONVERSATIONS: 'seph_ai_conversations',
  ACTIVE_CONVERSATION_ID: 'seph_ai_active_id',
  SETTINGS: 'seph_ai_settings',
  PENDING_AUTH_ACTION: 'seph_pending_auth_action',
};

/**
 * Loads all saved conversations from localStorage.
 */
export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load conversations from localStorage:', err);
  }
  return [];
}

/**
 * Saves all conversations to localStorage.
 */
export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (err) {
    console.error('Failed to save conversations to localStorage:', err);
  }
}

/**
 * Loads the active conversation ID.
 */
export function loadActiveConversationId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);
  } catch {
    return null;
  }
}

/**
 * Saves the active conversation ID.
 */
export function saveActiveConversationId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);
    }
  } catch (err) {
    console.error('Failed to save active conversation id:', err);
  }
}

/**
 * Loads user settings.
 */
export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Saves user settings.
 */
export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

/**
 * Clears all chat history from localStorage.
 */
export function clearAllConversations(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);
  } catch (err) {
    console.error('Failed to clear conversations:', err);
  }
}

/**
 * Stores a pending action (e.g. sending a message) to be resumed after authentication.
 */
export function savePendingAuthAction(action: PendingAuthAction): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PENDING_AUTH_ACTION, JSON.stringify(action));
  } catch (err) {
    console.error('Failed to save pending auth action:', err);
  }
}

/**
 * Retrieves the pending auth action if one exists and is not expired (TTL: 15 mins).
 */
export function loadPendingAuthAction(): PendingAuthAction | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENDING_AUTH_ACTION);
    if (!raw) return null;
    const action = JSON.parse(raw) as PendingAuthAction;
    // Check expiration (15 minutes)
    if (Date.now() - action.timestamp > 15 * 60 * 1000) {
      clearPendingAuthAction();
      return null;
    }
    return action;
  } catch (err) {
    console.error('Failed to load pending auth action:', err);
    return null;
  }
}

/**
 * Clears the pending auth action from storage to avoid duplicate submissions or loops.
 */
export function clearPendingAuthAction(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PENDING_AUTH_ACTION);
  } catch (err) {
    console.error('Failed to clear pending auth action:', err);
  }
}
