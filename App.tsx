import React from 'react';
import { LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AppProvider } from '@app/providers';
import { RootNavigator } from '@navigation/index';
import './global.css';

// Inicializa o Firebase na importação.
import '@services/firebase';

LogBox.ignoreLogs([
  '@firebase/database:',
  'FIREBASE WARNING',
  'Client is offline',
  'network-request-failed',
  'The Internet connection appears to be offline',
]);

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
