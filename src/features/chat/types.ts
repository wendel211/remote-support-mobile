export type MessageRole = 'attendant' | 'client';

export interface ChatMessage {
  id: string;
  sessionCode: string;
  text: string;
  role: MessageRole;
  timestamp: number;
  status: 'sending' | 'sent' | 'error';
}

export interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  error: string | null;
}
