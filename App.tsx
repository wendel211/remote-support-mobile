import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '@app/providers';

// Inicializa o Firebase na importação
import '@services/firebase';

export default function App(): React.JSX.Element {
  return (
    <AppProvider>
      <View style={styles.container}>
        <Text style={styles.title}>Remote Support</Text>
        <Text style={styles.subtitle}>Inicializando...</Text>
        <StatusBar style="auto" />
      </View>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});