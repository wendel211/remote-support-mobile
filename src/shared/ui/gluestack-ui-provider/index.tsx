import React from 'react';

interface GluestackUIProviderProps {
  children: React.ReactNode;
}

export function GluestackUIProvider({
  children,
}: GluestackUIProviderProps): React.JSX.Element {
  return <>{children}</>;
}
