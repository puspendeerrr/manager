import { apiClient } from './api';
import { AiChatResponse, ParsedTaskResult, TaskDecompositionResult } from '@sonam/shared';

export const aiService = {
  async chat(message: string, history?: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<AiChatResponse> {
    return apiClient.post('/ai/chat', { message, history });
  },

  async parseTask(text: string): Promise<ParsedTaskResult> {
    return apiClient.post('/ai/parse-task', { text });
  },

  async splitTask(goal: string): Promise<TaskDecompositionResult> {
    return apiClient.post('/ai/split-task', { goal });
  },
};
