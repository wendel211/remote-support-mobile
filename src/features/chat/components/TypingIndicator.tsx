import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import type { MessageRole } from '../types';

interface TypingIndicatorProps {
  visible: boolean;
  role: MessageRole;
}

const ROLE_LABELS: Record<MessageRole, string> = {
  attendant: 'Atendente está digitando...',
  client: 'Cliente está digitando...',
};

export function TypingIndicator({
  visible,
  role,
}: TypingIndicatorProps): React.JSX.Element | null {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();

      return () => {
        animation.stop();
      };
    }

    opacity.setValue(1);
    return undefined;
  }, [visible, opacity]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Animated.Text style={styles.text}>{ROLE_LABELS[role]}</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  text: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#6B7280',
  },
});
