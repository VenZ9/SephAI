export type MessageRole = 'user' | 'assistant' | 'system';

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

export const POPULAR_MODELS: ModelOption[] = [
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    description: 'Hybrid reasoning and high-level coding intelligence',
    provider: 'Anthropic',
    isPopular: true,
    tag: 'Flagship'
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Anthropic flagship model for reasoning and coding',
    provider: 'Anthropic',
    isPopular: true,
    tag: 'Recommended'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'OpenAI high-intelligence multimodal flagship',
    provider: 'OpenAI',
    isPopular: true,
    tag: 'Fast'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast, lightweight and cost-effective OpenAI model',
    provider: 'OpenAI',
    isPopular: true,
    tag: 'Economical'
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat (V3)',
    description: 'Open and powerful model from DeepSeek',
    provider: 'DeepSeek',
    isPopular: true,
    tag: 'Popular'
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek R1',
    description: 'Advanced deep chain-of-thought reasoning model',
    provider: 'DeepSeek',
    isPopular: true,
    tag: 'Reasoning'
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Google ultra-fast next-gen multimodal model',
    provider: 'Google',
    isPopular: true,
    tag: 'Fastest'
  },
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large',
    description: 'Top-tier reasoning and multilingual capacity',
    provider: 'Mistral',
    isPopular: false
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  defaultModel: 'claude-3-5-sonnet',
  systemPrompt: 'You are Seph AI, a helpful, precise, and thoughtful AI assistant. Give clear, well-structured, and concise answers using clean markdown formatting.',
  temperature: 0.7,
  streamResponse: true,
  sendOnEnter: true,
};
