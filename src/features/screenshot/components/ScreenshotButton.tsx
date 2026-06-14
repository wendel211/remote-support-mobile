import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface ScreenshotButtonProps {
  onPress: () => void;
  isLoading: boolean;
}

export function ScreenshotButton({
  onPress,
  isLoading,
}: ScreenshotButtonProps): React.JSX.Element {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        isLoading && styles.buttonDisabled,
        pressed && !isLoading && styles.buttonPressed,
      ]}
      onPress={onPress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color="#FFFFFF"
          style={styles.indicator}
        />
      ) : (
        <Text style={styles.icon}>📷</Text>
      )}
      <Text style={styles.text}>Solicitar Screenshot</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  indicator: {
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
