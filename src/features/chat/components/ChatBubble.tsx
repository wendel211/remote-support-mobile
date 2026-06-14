import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ChatMessage, MessageRole } from '../types';

interface ChatBubbleProps {
  message: ChatMessage;
  currentRole: MessageRole;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getStatusIndicator(status: ChatMessage['status']): string {
  switch (status) {
    case 'sending':
      return '⏳';
    case 'sent':
      return '✓';
    case 'error':
      return '✗ Erro';
  }
}

export function ChatBubble({
  message,
  currentRole,
}: ChatBubbleProps): React.JSX.Element {
  const isOwn = message.role === currentRole;

  return (
    <View
      style={[
        styles.wrapper,
        isOwn ? styles.wrapperOwn : styles.wrapperOther,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
        ]}
      >
        <Text
          style={[
            styles.text,
            isOwn ? styles.textOwn : styles.textOther,
          ]}
        >
          {message.text}
        </Text>
        <View style={styles.meta}>
          <Text
            style={[
              styles.time,
              isOwn ? styles.timeOwn : styles.timeOther,
            ]}
          >
            {formatTime(message.timestamp)}
          </Text>
          {isOwn && (
            <Text
              style={[
                styles.status,
                message.status === 'error' && styles.statusError,
              ]}
            >
              {getStatusIndicator(message.status)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 3,
    paddingHorizontal: 12,
  },
  wrapperOwn: {
    alignItems: 'flex-end',
  },
  wrapperOther: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleOwn: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#E5E7EB',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  textOwn: {
    color: '#FFFFFF',
  },
  textOther: {
    color: '#1A1A2E',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  time: {
    fontSize: 11,
  },
  timeOwn: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timeOther: {
    color: '#9CA3AF',
  },
  status: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statusError: {
    color: '#FCA5A5',
  },
});
