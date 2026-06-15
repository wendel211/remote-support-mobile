import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';
import { Box, HStack, Text, useTheme } from '@shared/ui';
import { useRenderMetric } from '@features/performance';
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
      return '...';
    case 'sent':
      return 'ok';
    case 'error':
      return 'erro';
  }
}

export function ChatBubble({
  message,
  currentRole,
}: ChatBubbleProps) {
  useRenderMetric(`ChatBubble:${message.role}`);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark, colors } = useTheme();

  if (message.role === 'system') {
    return (
      <Box className="my-2 items-center justify-center px-4">
        <Box
          className="rounded-full px-3.5 py-1"
          style={{
            backgroundColor: isDark ? colors.surfaceElevated : '#F1F5F9',
            borderWidth: 1,
            borderColor: isDark ? colors.cardBorder : '#E2E8F0',
          }}
        >
          <Text
            className="text-center text-[12px] leading-4"
            style={{ color: colors.textSecondary }}
            weight="semibold"
          >
            {message.text}
          </Text>
        </Box>
      </Box>
    );
  }

  const isOwn = message.role === currentRole;

  const textTrimmed = message.text.trim();
  const isUrl = /^https?:\/\/[^\s]+$/i.test(textTrimmed);

  const handlePressUrl = (): void => {
    if (isUrl) {
      navigation.navigate('WebView', { url: textTrimmed });
    }
  };

  const ownBubbleStyle = {
    backgroundColor: '#244AE2',
    alignSelf: 'flex-end' as const,
    borderBottomRightRadius: 6,
  };

  const otherBubbleStyle = {
    backgroundColor: isDark ? colors.surfaceElevated : '#E8EDF4',
    alignSelf: 'flex-start' as const,
    borderBottomLeftRadius: 6,
  };

  const bubbleStyle = isOwn ? ownBubbleStyle : otherBubbleStyle;
  const textColor = isOwn ? '#FFFFFF' : colors.text;
  const metaColor = isOwn ? 'rgba(255,255,255,0.65)' : colors.textTertiary;

  return (
    <Box className="px-3 py-1">
      <Box
        className="max-w-[82%] rounded-2xl px-3.5 py-2.5"
        style={bubbleStyle}
      >
        {isUrl ? (
          <Pressable className="items-start" onPress={handlePressUrl}>
            <Text
              className="underline text-[14px] leading-5"
              style={{ color: textColor }}
            >
              {message.text}
            </Text>
            <Box
              className="mt-2 rounded-ui px-3 py-1.5"
              style={{
                backgroundColor: isOwn
                  ? 'rgba(255,255,255,0.18)'
                  : isDark ? 'rgba(59,130,246,0.15)' : '#EEF4FF',
              }}
            >
              <Text
                className="text-[12px]"
                style={{ color: isOwn ? '#FFFFFF' : colors.accent }}
                weight="semibold"
              >
                Abrir link
              </Text>
            </Box>
          </Pressable>
        ) : (
          <Text
            className="leading-5 text-[14px]"
            style={{ color: textColor }}
          >
            {message.text}
          </Text>
        )}

        <HStack className="mt-1" space="xs">
          <Text className="text-[11px]" style={{ color: metaColor }}>
            {formatTime(message.timestamp)}
          </Text>
          {isOwn && (
            <Text
              className="text-[11px]"
              style={{ color: message.status === 'error' ? '#FCA5A5' : metaColor }}
            >
              {getStatusIndicator(message.status)}
            </Text>
          )}
        </HStack>
      </Box>
    </Box>
  );
}
