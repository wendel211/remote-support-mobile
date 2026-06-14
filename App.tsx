import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AppProvider } from '@app/providers';
import { RootNavigator } from '@navigation/index';

// Inicializa o Firebase na importação
import '@services/firebase';

export default function App(): React.JSX.Element {
  return (
    <AppProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </AppProvider>
  );
}