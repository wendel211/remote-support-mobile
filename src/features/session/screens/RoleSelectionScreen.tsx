import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelection'>;

export function RoleSelectionScreen({ navigation }: Props): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Remote Support</Text>
      <Text style={styles.subtitle}>Selecione seu perfil</Text>

      <View style={styles.buttonsContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.attendantButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigation.navigate('Attendant')}
        >
          <Text style={styles.buttonIcon}>🛠️</Text>
          <Text style={styles.buttonText}>Sou Atendente</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.clientButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigation.navigate('Client')}
        >
          <Text style={styles.buttonIcon}>👤</Text>
          <Text style={styles.buttonText}>Sou Cliente</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 48,
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    width: '100%',
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendantButton: {
    backgroundColor: '#4F46E5',
  },
  clientButton: {
    backgroundColor: '#0EA5E9',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
