import {
  addMessage,
  chatReducer,
  clearMessages,
  setError,
  setIsTyping,
  setMessages,
  updateMessageStatus,
} from './chatSlice';
import type { ChatMessage } from '../types';

const message: ChatMessage = {
  id: 'm1',
  sessionCode: 'ABC123',
  text: 'Olá',
  role: 'client',
  timestamp: 100,
  status: 'sending',
};

describe('chatSlice', () => {
  it('adds, replaces and updates messages', () => {
    let state = chatReducer(undefined, addMessage(message));
    expect(state.messages).toHaveLength(1);

    state = chatReducer(state, updateMessageStatus({ id: 'm1', status: 'sent' }));
    expect(state.messages[0].status).toBe('sent');

    state = chatReducer(state, updateMessageStatus({ id: 'missing', status: 'error' }));
    expect(state.messages[0].status).toBe('sent');

    const nextMessage = { ...message, id: 'm2', text: 'Tudo bem?' };
    state = chatReducer(state, setMessages([nextMessage]));
    expect(state.messages).toEqual([nextMessage]);
  });

  it('stores typing and error states and clears everything', () => {
    let state = chatReducer(undefined, setIsTyping(true));
    state = chatReducer(state, setError('Erro no chat'));

    expect(state.isTyping).toBe(true);
    expect(state.error).toBe('Erro no chat');

    state = chatReducer(state, clearMessages());
    expect(state).toEqual({ messages: [], isTyping: false, error: null });
  });
});
