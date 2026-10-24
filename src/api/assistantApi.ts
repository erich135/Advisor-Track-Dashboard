import { apiRequest } from './apiClient';
import type { AssistantAnswer } from '../assistant/types';

export type AssistantAskRequest = {
  question: string;
  pathname?: string;
  search?: string;
  previousQuestion?: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
  viewport?: 'desktop' | 'phone' | 'unknown';
  resetConversation?: boolean;
};

export type AssistantConversationTurn = {
  role: 'user' | 'assistant';
  text: string;
};

export type DexMemoryPreference = {
  available: boolean;
  enabled: boolean;
  consentedAt: string | null;
  disabledAt: string | null;
  revision: number;
};

export type DexMemoryFact = {
  id: string;
  kind: 'preference' | 'personal_fact';
  category: 'language' | 'brevity' | 'personal' | 'other';
  text: string;
  createdAt: string;
  expiresAt: string;
};

/**
 * Server-side Assistant ask (A6). Identity is reconstructed by the API.
 * The browser may send only the question and current path.
 */
export async function askAdvisorTrackAssistant(input: AssistantAskRequest): Promise<AssistantAnswer> {
  return apiRequest<AssistantAnswer>('/assistant/ask', {
    method: 'POST',
    body: {
      question: input.question,
      pathname: input.pathname,
      search: input.search,
      previousQuestion: input.previousQuestion,
      history: input.history,
      viewport: input.viewport,
      resetConversation: input.resetConversation,
    },
  });
}

export async function getAdvisorTrackAssistantConversation(): Promise<{
  turns: AssistantConversationTurn[];
}> {
  return apiRequest('/assistant/conversation');
}

export async function resetAdvisorTrackAssistantConversation(options?: {
  token?: string;
}): Promise<{ cleared: boolean }> {
  return apiRequest('/assistant/conversation/reset', {
    method: 'POST',
    token: options?.token,
    skipUnauthorizedHandler: true,
  });
}

export async function getDexMemoryPreference(): Promise<DexMemoryPreference> {
  return apiRequest('/assistant/memory/preference');
}

export async function setDexMemoryPreference(enabled: boolean): Promise<DexMemoryPreference> {
  return apiRequest('/assistant/memory/preference', {
    method: 'PUT',
    body: { enabled },
  });
}

export async function listDexMemories(): Promise<{ facts: DexMemoryFact[] }> {
  return apiRequest('/assistant/memory');
}

export async function forgetDexMemory(memoryId: string): Promise<{ forgotten: boolean }> {
  return apiRequest('/assistant/memory/forget', {
    method: 'POST',
    body: { memoryId },
  });
}

export async function forgetAllDexMemories(): Promise<{ forgotten: number }> {
  return apiRequest('/assistant/memory/forget-all', { method: 'POST' });
}
