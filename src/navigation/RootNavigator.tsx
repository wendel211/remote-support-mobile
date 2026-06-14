import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';

import { RoleSelectionScreen } from '@features/session/screens/RoleSelectionScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AttendantScreen(): React.JSX.Element {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Attendant</Text>
    </View>
  );
}

function ClientScreen(): React.JSX.Element {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Client</Text>
    </View>
  );
}

export function RootNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="RoleSelection"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="Attendant" component={AttendantScreen} />
      <Stack.Screen name="Client" component={ClientScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4FF',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
  },
});
