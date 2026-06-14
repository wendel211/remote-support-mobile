import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import type { Command, CommandType } from '../types';

interface CommandPikerProps {
  sessionCode: string;
  onSend: (command: Omit<Command, 'id' | 'sentAt' | 'acknowledgedAt'>) => void;
}

interface CommandDefinition {
  type: CommandType;
  label: string;
  emoji: string;
}

const COMMAND_DEFINITIONS: CommandDefinition[] = [
  { type: 'OPEN_SETTINGS', label: 'Abrir Configurações', emoji: '⚙️' },
  { type: 'RESTART_APP', label: 'Reiniciar Aplicativo', emoji: '🔄' },
  { type: 'NAVIGATE_URL', label: 'Navegar para URL', emoji: '🌐' },
  { type: 'CLEAR_CACHE', label: 'Limpar Cache', emoji: '🗑️' },
  { type: 'SHOW_INFO', label: 'Mostrar Informações do Dispositivo', emoji: 'ℹ️' },
];

export function CommandPicker({
  onSend,
}: CommandPikerProps): React.JSX.Element {
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleCommand = (definition: CommandDefinition): void => {
    if (definition.type === 'NAVIGATE_URL') {
      if (Platform.OS === 'ios') {
        Alert.prompt(
          'Navegar para URL',
          'Digite a URL de destino:',
          (url) => {
            if (url && url.trim().length > 0) {
              onSend({
                type: 'NAVIGATE_URL',
                label: 'Navegar para URL',
                payload: { url: url.trim() },
              });
            }
          },
          'plain-text',
          '',
          'url',
        );
      } else {
        setShowUrlInput(true);
      }
      return;
    }

    onSend({
      type: definition.type,
      label: definition.label,
    });
  };

  const handleConfirmUrl = (): void => {
    const trimmed = urlInput.trim();
    if (trimmed.length > 0) {
      onSend({
        type: 'NAVIGATE_URL',
        label: 'Navegar para URL',
        payload: { url: trimmed },
      });
    }
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleCancelUrl = (): void => {
    setUrlInput('');
    setShowUrlInput(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Comandos Predefinidos</Text>

      {COMMAND_DEFINITIONS.map((definition) => (
        <Pressable
          key={definition.type}
          style={({ pressed }) => [
            styles.commandButton,
            pressed && styles.commandButtonPressed,
          ]}
          onPress={() => handleCommand(definition)}
        >
          <Text style={styles.commandEmoji}>{definition.emoji}</Text>
          <Text style={styles.commandLabel}>{definition.label}</Text>
        </Pressable>
      ))}

      {showUrlInput && (
        <View style={styles.urlInputContainer}>
          <Text style={styles.urlInputLabel}>URL de destino:</Text>
          <TextInput
            style={styles.urlInput}
            value={urlInput}
            onChangeText={setUrlInput}
            placeholder="https://exemplo.com"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <View style={styles.urlActions}>
            <Pressable
              style={({ pressed }) => [
                styles.urlButton,
                styles.urlButtonCancel,
                pressed && styles.urlButtonPressed,
              ]}
              onPress={handleCancelUrl}
            >
              <Text style={styles.urlButtonCancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.urlButton,
                styles.urlButtonConfirm,
                pressed && styles.urlButtonPressed,
              ]}
              onPress={handleConfirmUrl}
            >
              <Text style={styles.urlButtonConfirmText}>Confirmar</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  commandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F5F3FF',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  commandButtonPressed: {
    opacity: 0.75,
    backgroundColor: '#EDE9FE',
  },
  commandEmoji: {
    fontSize: 16,
    marginRight: 10,
  },
  commandLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
    flexShrink: 1,
  },
  urlInputContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F0F4FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  urlInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 6,
  },
  urlInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 10,
  },
  urlActions: {
    flexDirection: 'row',
    gap: 8,
  },
  urlButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  urlButtonPressed: {
    opacity: 0.8,
  },
  urlButtonCancel: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  urlButtonConfirm: {
    backgroundColor: '#4F46E5',
  },
  urlButtonCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  urlButtonConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
