import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button, ButtonText, HStack, Input } from '@shared/ui';

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
  const [text, setText] = useState('');
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
    <HStack className="items-end border-t border-border bg-surface px-3 py-2" space="sm">
      <Input
        className="max-h-[100px] flex-1 rounded-full bg-slate-100"
        value={text}
        onChangeText={handleChangeText}
        placeholder="Digite uma mensagem..."
        multiline
        editable={!disabled}
      />
      <Button
        className="min-h-11 rounded-full px-5"
        disabled={isSendDisabled}
        onPress={handleSend}
      >
        <ButtonText size="sm">Enviar</ButtonText>
      </Button>
    </HStack>
  );
}
