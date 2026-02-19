import { apiClient } from '../client';

export interface ChatMessageRequest {
  message: string;
  context?: Record<string, any>;
  conversation_id?: string;
}

export interface ChatMessageResponse {
  response: string;
  conversation_id: string;
  suggestions: string[];
  resources: Array<{ title: string; url: string; description: string }>;
}

export const chatService = {
  async sendMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    const response = await apiClient.post('/chat/message', request);
    return response.data;
  },

  // Legacy method for compatibility with existing chatbot
  async sendChatMessage(message: string, context?: any): Promise<string> {
    const request: ChatMessageRequest = {
      message,
      context
    };
    
    const response = await this.sendMessage(request);
    return response.response;
  }
};