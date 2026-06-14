import { configureStore } from '@reduxjs/toolkit';
import { sessionReducer } from '@features/session/store';
import { chatReducer } from '@features/chat/store';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    chat: chatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

