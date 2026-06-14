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
    <Button className="min-h-11" disabled={isLoading} onPress={onPress}>
      <HStack space="sm">
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text tone="inverse">📷</Text>
        )}
        <ButtonText size="sm">
          {isLoading ? 'Solicitando...' : 'Solicitar screenshot'}
        </ButtonText>
      </HStack>
    </Button>
  );
}
