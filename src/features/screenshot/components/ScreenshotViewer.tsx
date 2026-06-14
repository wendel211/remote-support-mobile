import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Modal, Text } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getPoppinsTextStyle } from '@shared/ui/typography';

interface ScreenshotViewerProps {
  base64: string | null;
  onClose: () => void;
}

export function ScreenshotViewer({
  base64,
  onClose,
}: ScreenshotViewerProps): React.JSX.Element | null {
  if (!base64) {
    return null;
  }

  return (
    <Modal
      visible={base64 !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
          <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.header}>
          <Text style={styles.title}>Captura recebida</Text>
          <Text style={styles.subtitle}>Tela renderizada do app do cliente</Text>
        </View>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: `data:image/jpeg;base64,${base64}` }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    width: '100%',
    marginBottom: 14,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    ...getPoppinsTextStyle('bold'),
    textAlign: 'center',
  },
  subtitle: {
    color: '#CBD5E1',
    fontSize: 13,
    ...getPoppinsTextStyle('regular'),
    marginTop: 4,
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: '75%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#1E293B',
  },
});
