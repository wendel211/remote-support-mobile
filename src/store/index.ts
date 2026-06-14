import { configureStore } from '@reduxjs/toolkit';
import { sessionReducer } from '@features/session/store';
import { chatReducer } from '@features/chat/store';
import { screenshotReducer } from '@features/screenshot/store';
import { commandsReducer } from '@features/commands/store';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    chat: chatReducer,
    screenshot: screenshotReducer,
    commands: commandsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
