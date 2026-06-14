import React from 'react';
import { OverlayProvider } from '@gluestack-ui/overlay';
import { ToastProvider } from '@gluestack-ui/toast';

interface GluestackUIProviderProps {
  children: React.ReactNode;
}

export function GluestackUIProvider({
  children,
}: GluestackUIProviderProps): React.JSX.Element {
  return (
    <OverlayProvider>
      <ToastProvider>{children}</ToastProvider>
    </OverlayProvider>
  );
}

