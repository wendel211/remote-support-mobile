import React from 'react';
import { render, type RenderOptions } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@shared/ui';
import { sessionReducer } from '@features/session/store';
import { chatReducer } from '@features/chat/store';
import { screenshotReducer } from '@features/screenshot/store';
import { commandsReducer } from '@features/commands/store';
import { performanceReducer } from '@features/performance/store';

export function createTestStore() {
  return configureStore({
    reducer: {
      session: sessionReducer,
      chat: chatReducer,
      screenshot: screenshotReducer,
      commands: commandsReducer,
      performance: performanceReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }),
  });
}

export async function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions,
) {
  const store = createTestStore();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <ThemeProvider>{children}</ThemeProvider>
      </Provider>
    );
  }

  return {
    store,
    ...(await render(ui, { wrapper: Wrapper, ...options })),
  };
}
