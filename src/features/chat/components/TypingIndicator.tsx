import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Box, Text } from '@shared/ui';
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
    <Animated.View style={{ opacity }}>
      <Box className="px-4 py-1.5">
        <Text className="italic" size="sm" tone="muted">
          {ROLE_LABELS[role]}
        </Text>
      </Box>
    </Animated.View>
  );
}
