import React from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, ButtonText, HStack, Text } from '@shared/ui';

interface ScreenshotButtonProps {
  onPress: () => void;
  isLoading: boolean;
}

export function ScreenshotButton({
  onPress,
  isLoading,
}: ScreenshotButtonProps): React.JSX.Element {
  return (
    <Button disabled={isLoading} onPress={onPress}>
      <HStack space="sm">
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text tone="inverse">📷</Text>
        )}
        <ButtonText>
          {isLoading ? 'Solicitando...' : 'Solicitar screenshot'}
        </ButtonText>
      </HStack>
    </Button>
  );
}
