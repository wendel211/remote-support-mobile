import React from 'react';
import {
  Modal,
  View,
  Image,
  Pressable,
  Text,
  StyleSheet,
} from 'react-native';

interface ScreenshotViewerProps {
  base64: string | null;
  onClose: () => void;
}

export function ScreenshotViewer({
  base64,
  onClose,
}: ScreenshotViewerProps): React.JSX.Element {
  const visible = base64 !== null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {base64 ? (
            <Image
              source={{ uri: `data:image/jpg;base64,${base64}` }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : null}
          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Fechar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 450,
    borderRadius: 8,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  closeButtonPressed: {
    opacity: 0.85,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
