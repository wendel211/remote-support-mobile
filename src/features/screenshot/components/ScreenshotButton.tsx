import React from 'react';
import { ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Button, ButtonText, HStack } from '@shared/ui';

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
      <HStack className="items-center justify-center" space="sm">
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <MaterialCommunityIcons name="camera" size={18} color="#FFFFFF" />
        )}
        <ButtonText size="sm">
          {isLoading ? 'Solicitando...' : 'Solicitar captura do app'}
        </ButtonText>
      </HStack>
    </Button>
  );
}
