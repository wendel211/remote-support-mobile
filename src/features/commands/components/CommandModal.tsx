import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import type { Command } from '../types';

interface CommandModalProps {
  command: Command | null;
  onAcknowledge: () => void;
}

const COMMAND_EMOJIS: Record<Command['type'], string> = {
  OPEN_SETTINGS: '⚙️',
  RESTART_APP: '🔄',
  NAVIGATE_URL: '🌐',
  CLEAR_CACHE: '🗑️',
  SHOW_INFO: 'ℹ️',
};

export function CommandModal({
  command,
  onAcknowledge,
}: CommandModalProps): React.JSX.Element {
  return (
    <Modal
      visible={command !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>
            {command ? COMMAND_EMOJIS[command.type] : ''}
          </Text>

          <Text style={styles.titleLabel}>Comando recebido</Text>

          <Text style={styles.commandLabel}>{command?.label ?? ''}</Text>

          {command?.type === 'NAVIGATE_URL' && command.payload?.url ? (
            <View style={styles.urlBadge}>
              <Text style={styles.urlText} numberOfLines={2}>
                {command.payload.url}
              </Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.acknowledgeButton,
              pressed && styles.acknowledgeButtonPressed,
            ]}
            onPress={onAcknowledge}
          >
            <Text style={styles.acknowledgeButtonText}>Entendido</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  titleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  commandLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 16,
  },
  urlBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    width: '100%',
  },
  urlText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '500',
    textAlign: 'center',
  },
  acknowledgeButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    marginTop: 8,
  },
  acknowledgeButtonPressed: {
    opacity: 0.85,
  },
  acknowledgeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
