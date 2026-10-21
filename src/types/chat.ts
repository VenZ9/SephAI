export type MessageRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  modelUsed?: string;
  isStreaming?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  model: string;
}

export interface PuterUser {
  username: string;
  uuid?: string;
  email?: string;
}

export interface AppSettings {
  defaultModel: string;
  systemPrompt: string;
  temperature: number;
  streamResponse: boolean;
  sendOnEnter: boolean;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  provider: string;
  isPopular?: boolean;
  tag?: string;
}

export interface PendingAuthAction {
  type: 'send_message' | 'regenerate';
  conversationId: string;
  messageText?: string;
  model: string;
  timestamp: number;
}

/**
 * Curated list of verified, actively supported models on Puter AI.
 * Sourced directly from Puter.js models registry.
 */
export const POPULAR_MODELS: ModelOption[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast, lightweight and cost-effective OpenAI model',
    provider: 'OpenAI',
    isPopular: true,
    tag: 'Recommended'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'OpenAI flagship multimodal intelligence',
    provider: 'OpenAI',
    isPopular: true,
    tag: 'Flagship'
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    description: 'Anthropic flagship reasoning and high-level coding intelligence',
    provider: 'Anthropic',
    isPopular: true,
    tag: 'Intelligence'
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    description: 'Fast Anthropic model for snappy, high-volume tasks',
    provider: 'Anthropic',
    isPopular: true,
    tag: 'Snappy'
  },
  {
    id: 'deepseek-flash',
    name: 'DeepSeek V4.1 Flash',
    description: 'High-speed reasoning and synthesis from DeepSeek',
    provider: 'DeepSeek',
    isPopular: true,
    tag: 'Fast'
  },
  {
    id: 'deepseek-v4-pro',
    name: 'DeepSeek V4 Pro',
    description: 'Deep chain-of-thought advanced reasoning model',
    provider: 'DeepSeek',
    isPopular: true,
    tag: 'Reasoning'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Google ultra-fast multimodal model',
    provider: 'Google',
    isPopular: true,
    tag: 'Fastest'
  },
  {
    id: 'mistral-small-2603',
    name: 'Mistral Small',
    description: 'Efficient, multilingual reasoning and logic',
    provider: 'Mistral',
    isPopular: false
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  defaultModel: 'gpt-4o-mini',
  systemPrompt: 'You are Seph AI, a helpful, precise, and thoughtful AI assistant. Give clear, well-structured, and concise answers using clean markdown formatting.',
  temperature: 0.7,
  streamResponse: true,
  sendOnEnter: true,
};
