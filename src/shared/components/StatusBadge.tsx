import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SessionStatus } from '@features/session/types';

interface StatusBadgeProps {
  status: SessionStatus;
}

const STATUS_CONFIG: Record<SessionStatus, { color: string; label: string }> = {
  idle: { color: '#9CA3AF', label: 'Inativo' },
  waiting: { color: '#F59E0B', label: 'Aguardando' },
  connected: { color: '#10B981', label: 'Conectado' },
  ended: { color: '#EF4444', label: 'Encerrado' },
};

export function StatusBadge({ status }: StatusBadgeProps): React.JSX.Element {
  const config = STATUS_CONFIG[status];

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
