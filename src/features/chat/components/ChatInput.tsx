import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ButtonText, HStack, Input, useTheme } from '@shared/ui';
import { useRenderMetric } from '@features/performance';

interface ChatInputProps {
  onSend: (text: string) => void;
  onTypingChange: (isTyping: boolean) => void;
  disabled?: boolean;
}

const TYPING_TIMEOUT_MS = 1000;

export function ChatInput({
  onSend,
  onTypingChange,
  disabled = false,
}: ChatInputProps): React.JSX.Element {
  useRenderMetric('ChatInput');
  const [text, setText] = useState('');
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleChangeText = useCallback(
    (value: string) => {
      setText(value);

      if (!isTypingRef.current && value.length > 0) {
        isTypingRef.current = true;
        onTypingChange(true);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          isTypingRef.current = false;
          onTypingChange(false);
        }
      }, TYPING_TIMEOUT_MS);
    },
    [onTypingChange],
  );

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || disabled) {
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingChange(false);
    }

    onSend(trimmed);
    setText('');
  }, [text, disabled, onSend, onTypingChange]);

  const isSendDisabled = text.trim().length === 0 || disabled;

  return (
    <HStack
      className="items-end px-4 py-3"
      style={{
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderColor: colors.separator,
        paddingBottom: Math.max(insets.bottom, 28),
      }}
      space="sm"
    >
      <Input
        className="max-h-[96px] min-h-11 flex-1 rounded-ui"
        value={text}
        onChangeText={handleChangeText}
        placeholder="Digite uma mensagem..."
        placeholderTextColor={colors.placeholder}
        multiline
        editable={!disabled}
        style={{
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder,
          color: colors.inputText,
        }}
      />
      <Button
        className="min-h-11 rounded-ui px-4"
        disabled={isSendDisabled}
        onPress={handleSend}
      >
        <ButtonText size="sm">Enviar</ButtonText>
      </Button>
    </HStack>
  );
}
