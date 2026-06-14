import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '@store/index';
import { GluestackUIProvider } from '@shared/ui';

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps): React.JSX.Element {
  return (
    <ReduxProvider store={store}>
      <SafeAreaProvider>
        <GluestackUIProvider>{children}</GluestackUIProvider>
      </SafeAreaProvider>
    </ReduxProvider>
  );
}
