import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RoleSelectionScreen } from '@features/session/screens/RoleSelectionScreen';
import { AttendantScreen } from '@features/session/screens/AttendantScreen';
import { ClientScreen } from '@features/session/screens/ClientScreen';
import { WebViewScreen } from '@features/webview';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="RoleSelection"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="Attendant" component={AttendantScreen} />
      <Stack.Screen name="Client" component={ClientScreen} />
      <Stack.Screen name="WebView" component={WebViewScreen} />
    </Stack.Navigator>
  );
}

