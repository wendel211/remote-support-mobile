import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';

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
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={handleChangeText}
        placeholder="Digite uma mensagem..."
        placeholderTextColor="#9CA3AF"
        multiline
        editable={!disabled}
      />
      <Pressable
        style={({ pressed }) => [
          styles.sendButton,
          isSendDisabled && styles.sendButtonDisabled,
          pressed && !isSendDisabled && styles.sendButtonPressed,
        ]}
        onPress={handleSend}
        disabled={isSendDisabled}
      >
        <Text
          style={[
            styles.sendButtonText,
            isSendDisabled && styles.sendButtonTextDisabled,
          ]}
        >
          Enviar
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A2E',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendButtonPressed: {
    opacity: 0.85,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sendButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
