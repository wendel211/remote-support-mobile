import React from 'react';
import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';
import { Box, HStack, Text } from '@shared/ui';
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
      return '✕ Erro';
  }
}

export function ChatBubble({
  message,
  currentRole,
}: ChatBubbleProps): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isOwn = message.role === currentRole;

  const textTrimmed = message.text.trim();
  const isUrl = /^https?:\/\/[^\s]+$/i.test(textTrimmed);

  const handlePressUrl = (): void => {
    if (isUrl) {
      navigation.navigate('WebView', { url: textTrimmed });
    }
  };

  const bubbleClass = isOwn
    ? 'self-end rounded-br-md bg-primary-600'
    : 'self-start rounded-bl-md bg-slate-200';
  const textClass = isOwn ? 'text-white' : 'text-foreground';
  const metaClass = isOwn ? 'text-white/70' : 'text-slate-500';

  return (
    <Box className="px-3 py-1">
      <Box className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 ${bubbleClass}`}>
        {isUrl ? (
          <Pressable className="items-start" onPress={handlePressUrl}>
            <Text className={`underline ${textClass}`} size="sm">
              {message.text}
            </Text>
            <Box
              className={`mt-2 rounded-ui px-3 py-1.5 ${
                isOwn ? 'bg-white/20' : 'bg-primary-50'
              }`}
            >
              <Text
                className={isOwn ? 'text-white' : 'text-primary-700'}
                size="xs"
                weight="semibold"
              >
                🌐 Abrir link
              </Text>
            </Box>
          </Pressable>
        ) : (
          <Text className={`leading-5 ${textClass}`} size="sm">
            {message.text}
          </Text>
        )}

        <HStack className="mt-1" space="xs">
          <Text className={metaClass} size="xs">
            {formatTime(message.timestamp)}
          </Text>
          {isOwn && (
            <Text
              className={message.status === 'error' ? 'text-red-200' : metaClass}
              size="xs"
            >
              {getStatusIndicator(message.status)}
            </Text>
          )}
        </HStack>
      </Box>
    </Box>
  );
}
