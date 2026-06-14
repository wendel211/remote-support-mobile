import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage, ChatState } from '../types';

const initialState: ChatState = {
  messages: [],
  isTyping: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
    },
    setMessages(state, action: PayloadAction<ChatMessage[]>) {
      state.messages = action.payload;
    },
    updateMessageStatus(
      state,
      action: PayloadAction<{ id: string; status: ChatMessage['status'] }>,
    ) {
      const message = state.messages.find(
        (msg) => msg.id === action.payload.id,
      );
      if (message) {
        message.status = action.payload.status;
      }
    },
    setIsTyping(state, action: PayloadAction<boolean>) {
      state.isTyping = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearMessages(state) {
      state.messages = [];
      state.isTyping = false;
      state.error = null;
    },
  },
});

export const {
  addMessage,
  setMessages,
  updateMessageStatus,
  setIsTyping,
  setError,
  clearMessages,
} = chatSlice.actions;

export const chatReducer = chatSlice.reducer;
